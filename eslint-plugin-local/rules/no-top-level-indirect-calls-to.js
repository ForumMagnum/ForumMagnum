// @ts-check
/** @typedef {import('@typescript-eslint/utils').ESLintUtils.RuleModule<string, Array<{names: string[], checkMemberCalls: boolean, maxDepth: number, crossFile: boolean, forbiddenMethods: {className: string, methodNames: string[]}[]}>>} RuleModule */
/** @typedef {import('typescript')} typescript */
/** @type {typescript} */
let ts;
try { ts = require('typescript'); } catch {
  /* type-aware cross-file disabled if TS not found */
}

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** @type {RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow top-level calls that directly or indirectly invoke certain functions or class methods',
      recommended: false,
      requiresTypeChecking: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          names: { type: 'array', items: { type: 'string' }, minItems: 1 },
          checkMemberCalls: { type: 'boolean', default: true },
          maxDepth: { type: 'integer', minimum: 1, default: 3 },
          crossFile: { type: 'boolean', default: true }, // turn off to keep same-file only
          forbiddenMethods: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                className: { type: 'string' },
                methodNames: { type: 'array', items: { type: 'string' }, minItems: 1 },
              },
              required: ['className', 'methodNames'],
              additionalProperties: false,
            },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noTop: 'Do not invoke {{name}} at the module top level (directly or indirectly). Only call it from within a run-time context (i.e. component, resolver, etc).',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const BANNED = new Set(options.names || []);
    const CHECK_MEMBER = options.checkMemberCalls !== false;
    const MAX_DEPTH = options.maxDepth ?? 3;
    const CROSS_FILE = options.crossFile !== false;

    // Map of className -> Set<methodName>
    const FORBIDDEN_METHODS = new Map();
    if (Array.isArray(options.forbiddenMethods)) {
      for (const item of options.forbiddenMethods) {
        if (!item || typeof item.className !== 'string' || !Array.isArray(item.methodNames)) continue;
        const set = new Set(item.methodNames);
        FORBIDDEN_METHODS.set(item.className, set);
      }
    }

    /** @type {Record<string, any>} */
    const fnMap = Object.create(null); // current file: name -> ESTree function node

    // === Utilities (ESTree side) =================================================

    function isInsideFunction(node) {
      for (let p = node.parent; p; p = p.parent) {
        if (FUNCTION_TYPES.has(p.type)) return true;
      }
      return false;
    }

    function unwrapChain(expr) {
      return expr && expr.type === 'ChainExpression' ? expr.expression : expr;
    }

    // Cycle-safe, iterative walk that skips ESLint bookkeeping keys + nested fns
    function walkESTree(root, visitor) {
      if (!root || typeof root !== 'object') return;
      const stack = [root];
      const seen = new Set();
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n.type !== 'string') continue;
        if (seen.has(n)) continue;
        seen.add(n);

        const descend = visitor(n);
        if (descend === false) continue;

        for (const key of Object.keys(n)) {
          if (key === 'parent' || key === 'loc' || key === 'range' || key === 'tokens' || key === 'comments') continue;
          const val = n[key];
          if (!val) continue;

          if (Array.isArray(val)) {
            for (let i = val.length - 1; i >= 0; i--) {
              const c = val[i];
              if (c && typeof c.type === 'string') {
                if (FUNCTION_TYPES.has(c.type) && c !== root) continue;
                stack.push(c);
              }
            }
          } else if (val && typeof val.type === 'string') {
            if (FUNCTION_TYPES.has(val.type) && val !== root) continue;
            stack.push(val);
          }
        }
      }
    }

    function isDirectBannedCall_ESTree(callExpr) {
      const call = unwrapChain(callExpr);
      const callee = call.callee;

      if (callee.type === 'Identifier') {
        return { hit: BANNED.has(callee.name), name: callee.name };
      }

      if (
        CHECK_MEMBER &&
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.property.type === 'Identifier' &&
        BANNED.has(callee.property.name)
      ) {
        return { hit: true, name: callee.property.name };
      }

      return { hit: false, name: null };
    }

    function functionCallsBannedTransitively_ESTree(fnNode, depth, seenFns) {
      if (depth > MAX_DEPTH) return null;

      let found = null;
      walkESTree(fnNode.body || fnNode, (n) => {
        if (found) return false;

        if (n.type === 'CallExpression') {
          // direct banned?
          const r = isDirectBannedCall_ESTree(n);
          if (r.hit) { found = r.name; return false; }

          // call to other known top-level function in this file?
          const c = unwrapChain(n).callee;
          if (c && c.type === 'Identifier') {
            const target = fnMap[c.name];
            if (target && !seenFns.has(target)) {
              seenFns.add(target);
              const via = functionCallsBannedTransitively_ESTree(target, depth + 1, seenFns);
              if (via) { found = via; return false; }
            }
          }

          // IIFE
          if (c && (c.type === 'FunctionExpression' || c.type === 'ArrowFunctionExpression')) {
            const via = functionCallsBannedTransitively_ESTree(c, depth + 1, seenFns);
            if (via) { found = via; return false; }
          }
        }
      });

      return found; // string | null
    }

    // === Cross-file (TypeScript) side ===========================================

    const services = context.parserServices;
    const haveTS = !!(ts && services && services.program && services.esTreeNodeToTSNodeMap);
    const checker = haveTS ? services.program.getTypeChecker() : null;

    /** cache: ts.SourceFile.fileName -> Map<string, ts.FunctionLike> */
    const moduleFnCache = new Map(); // per TS file top-level functions

    /** cache: local imported name in current file -> ts.FunctionLike (from other file) */
    const importedFnMap = new Map();

    function collectTopLevelTSFunctions(sourceFile) {
      if (moduleFnCache.has(sourceFile.fileName)) return moduleFnCache.get(sourceFile.fileName);

      const map = new Map(); // name -> ts function-like
      const isFnInit = (init) =>
        !!init && (ts.isFunctionExpression(init) || ts.isArrowFunction(init));

      sourceFile.forEachChild((stmt) => {
        if (ts.isFunctionDeclaration(stmt) && stmt.name) {
          map.set(stmt.name.text, stmt);
        } else if (ts.isVariableStatement(stmt)) {
          for (const decl of stmt.declarationList.declarations) {
            if (ts.isIdentifier(decl.name) && isFnInit(decl.initializer)) {
              map.set(decl.name.text, decl.initializer);
            }
          }
        }
      });

      moduleFnCache.set(sourceFile.fileName, map);
      return map;
    }

    function resolveImportedFunction(localName) {
      if (!haveTS || !CROSS_FILE) return null;
      if (importedFnMap.has(localName)) {
        const cached = importedFnMap.get(localName);
        // Only return if we've actually resolved (cached !== undefined)
        if (cached !== undefined) return cached || null;
      }

      // Find the ImportSpecifier/ImportDefaultSpecifier with this local name
      const src = context.getSourceCode().ast;
      let tsLocalId = null;
      for (const node of src.body) {
        if (node.type !== 'ImportDeclaration') continue;
        for (const s of node.specifiers) {
          if (s.local && s.local.name === localName) {
            // map the *local* identifier to a TS node
            tsLocalId = services.esTreeNodeToTSNodeMap.get(s.local);
            break;
          }
        }
        if (tsLocalId) break;
      }
      if (!tsLocalId) { importedFnMap.set(localName, null); return null; }

      let sym = checker?.getSymbolAtLocation(tsLocalId);
      if (!sym) { importedFnMap.set(localName, null); return null; }

      if ((sym.flags & ts.SymbolFlags.Alias) !== 0) {
        sym = checker?.getAliasedSymbol(sym);
      }

      const decls = sym?.getDeclarations?.() || [];
      for (const d of decls) {
        // function foo() {}
        if (ts.isFunctionDeclaration(d)) {
          const sf = d.getSourceFile();
          importedFnMap.set(localName, d);
          // also ensure that module function cache is filled for that file
          collectTopLevelTSFunctions(sf);
          return d;
        }
        // const foo = () => {}
        if (ts.isVariableDeclaration(d) && d.initializer &&
            (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
          const sf = d.getSourceFile();
          importedFnMap.set(localName, d.initializer);
          collectTopLevelTSFunctions(sf);
          return d.initializer;
        }
        // export { foo } from './x' — we got the original decl above thanks to getAliasedSymbol
      }

      importedFnMap.set(localName, null);
      return null;
    }

    function isDirectBannedCall_TS(callExpr) {
      // callExpr: ts.CallExpression
      let callee = callExpr.expression;
      // optional chaining: CallExpression with expression possibly a PropertyAccessChain/ElementAccessChain/Identifier
      // Normalize property access chain to a property access if possible
      if (ts.isIdentifier(callee)) {
        return { hit: BANNED.has(callee.text), name: callee.text };
      }
      if (CHECK_MEMBER && ts.isPropertyAccessExpression(callee)) {
        const name = callee.name.text;
        return { hit: BANNED.has(name), name };
      }
      return { hit: false, name: null };
    }

    // Simple TS walker that stays within a function body and doesn’t traverse nested function bodies
    function walkTSFunctionBody(fnNode, visitor) {
      const root = ts.isFunctionDeclaration(fnNode) ? fnNode.body : fnNode.body;
      if (!root) return;

      const stack = [root];
      while (stack.length) {
        const n = stack.pop();

        const descend = visitor(n);
        if (descend === false) continue;

        n.forEachChild((child) => {
          // stop at nested function-like nodes
          if (
            ts.isFunctionDeclaration(child) ||
            ts.isFunctionExpression(child) ||
            ts.isArrowFunction(child) ||
            ts.isMethodDeclaration(child)
          ) {
            return;
          }
          stack.push(child);
        });
      }
    }

    function tsFunctionCallsBannedTransitively(fnNode, depth, seenSet) {
      if (depth > MAX_DEPTH) return null;

      let result = null;
      const sourceFile = fnNode.getSourceFile();
      const topLevelFns = collectTopLevelTSFunctions(sourceFile);

      walkTSFunctionBody(fnNode, (n) => {
        if (result) return false;

        if (ts.isCallExpression(n)) {
          const r = isDirectBannedCall_TS(n);
          if (r.hit) { result = r.name; return false; }

          // Direct forbidden class method call: obj.method()
          if (FORBIDDEN_METHODS.size && checker && ts.isPropertyAccessExpression(n.expression)) {
            const methodName = n.expression.name.text;
            for (const [className, methodSet] of FORBIDDEN_METHODS) {
              if (!methodSet.has(methodName)) continue;
              const recvType = checker.getTypeAtLocation(n.expression.expression);
              const recvSym = recvType && (recvType.symbol || recvType.aliasSymbol);
              const recvName = recvSym && recvSym.getName && recvSym.getName();
              if (recvName === className) {
                result = `${className}.${methodName}`;
                return false;
              }
            }
          }

          // Call to another function by Identifier in the same module?
          const expr = n.expression;
          if (ts.isIdentifier(expr)) {
            const target = topLevelFns.get(expr.text);
            if (target && !seenSet.has(target)) {
              seenSet.add(target);
              const via = tsFunctionCallsBannedTransitively(target, depth + 1, seenSet);
              if (via) { result = via; return false; }
            }

            // Cross-file: resolve identifier to its declaration via type checker
            if (haveTS && checker) {
              let sym = checker.getSymbolAtLocation(expr);
              if (sym && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
                sym = checker.getAliasedSymbol(sym);
              }
              const decls = sym?.getDeclarations?.() || [];
              for (const d of decls) {
                let fnLike = null;
                if (ts.isFunctionDeclaration(d)) {
                  fnLike = d;
                } else if (ts.isVariableDeclaration(d) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
                  fnLike = d.initializer;
                }
                if (fnLike && !seenSet.has(fnLike)) {
                  // ensure cache for that file is populated (helps same-file recursion within that module)
                  collectTopLevelTSFunctions(fnLike.getSourceFile());
                  seenSet.add(fnLike);
                  const via = tsFunctionCallsBannedTransitively(fnLike, depth + 1, seenSet);
                  if (via) { result = via; return false; }
                }
              }
            }
          }

          // Call to a method: obj.method()
          if (haveTS && checker && (ts.isPropertyAccessExpression(expr))) {
            // Prefer the resolved signature (handles class methods nicely)
            const sig = checker.getResolvedSignature(n);
            const decl = sig?.declaration;
            if (decl) {
              let fnLike = null;
              if (ts.isMethodDeclaration(decl) || ts.isFunctionDeclaration(decl)) {
                fnLike = decl;
              } else if (ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) {
                fnLike = decl;
              }
              if (fnLike && !seenSet.has(fnLike)) {
                collectTopLevelTSFunctions(fnLike.getSourceFile());
                seenSet.add(fnLike);
                const via = tsFunctionCallsBannedTransitively(fnLike, depth + 1, seenSet);
                if (via) { result = via; return false; }
              }
            }

            // Fallback: resolve the property symbol to its declarations
            let sym = checker.getSymbolAtLocation(expr.name);
            if (sym && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
              sym = checker.getAliasedSymbol(sym);
            }
            const decls = sym?.getDeclarations?.() || [];
            for (const d of decls) {
              let fnLike = null;
              if (ts.isMethodDeclaration(d) || ts.isFunctionDeclaration(d)) {
                fnLike = d;
              } else if (ts.isVariableDeclaration(d) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
                fnLike = d.initializer;
              }
              if (fnLike && !seenSet.has(fnLike)) {
                collectTopLevelTSFunctions(fnLike.getSourceFile());
                seenSet.add(fnLike);
                const via = tsFunctionCallsBannedTransitively(fnLike, depth + 1, seenSet);
                if (via) { result = via; return false; }
              }
            }
          }

          // IIFE: (() => isLW())()
          if (ts.isFunctionExpression(expr) || ts.isArrowFunction(expr)) {
            const via = tsFunctionCallsBannedTransitively(expr, depth + 1, seenSet);
            if (via) { result = via; return false; }
          }
        }
      });

      return result; // string | null
    }

    // === ESLint visitors ========================================================

    return {
      Program(node) {
        // Build same-file top-level function map
        for (const stmt of node.body) {
          if (stmt.type === 'FunctionDeclaration' && stmt.id?.name) {
            fnMap[stmt.id.name] = stmt;
          } else if (stmt.type === 'VariableDeclaration') {
            for (const d of stmt.declarations) {
              if (
                d.id?.type === 'Identifier' &&
                d.init &&
                FUNCTION_TYPES.has(d.init.type)
              ) {
                fnMap[d.id.name] = d.init;
              }
            }
          } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration) {
            const decl = stmt.declaration;
            if (decl.type === 'FunctionDeclaration' && decl.id?.name) {
              fnMap[decl.id.name] = decl;
            } else if (decl.type === 'VariableDeclaration') {
              for (const d of decl.declarations) {
                if (
                  d.id?.type === 'Identifier' &&
                  d.init &&
                  FUNCTION_TYPES.has(d.init.type)
                ) {
                  fnMap[d.id.name] = d.init;
                }
              }
            }
          }
        }

        // Pre-scan imports so we can resolve quickly on demand
        if (haveTS && CROSS_FILE) {
          const src = context.getSourceCode().ast;
          for (const imp of src.body) {
            if (imp.type !== 'ImportDeclaration') continue;
            for (const s of imp.specifiers) {
              if (!s.local) continue;
              // lazily resolved later by resolveImportedFunction
              importedFnMap.set(s.local.name, undefined);
            }
          }
        }
      },

      CallExpression(node) {
        // Only care about top-level (import-time) calls
        if (isInsideFunction(node)) return;

        // 1) Direct banned function call at this site (proximal wins)
        {
          const { hit, name } = isDirectBannedCall_ESTree(node);
          if (hit) {
            context.report({ node, messageId: 'noTop', data: { name } });
            return;
          }
        }

        // 1b) Direct forbidden class method call at this site (e.g., obj.get())
        if (FORBIDDEN_METHODS.size && haveTS && checker && CROSS_FILE) {
          const callee0 = unwrapChain(node).callee;
          if (callee0.type === 'MemberExpression' || callee0.type === 'OptionalMemberExpression') {
            try {
              const tsCall = context.parserServices.esTreeNodeToTSNodeMap.get(node);
              if (tsCall && ts.isCallExpression(tsCall)) {
                const expr = tsCall.expression;
                if (ts.isPropertyAccessExpression(expr)) {
                  const methodName = expr.name.text;
                  for (const [className, methodSet] of FORBIDDEN_METHODS) {
                    if (!methodSet.has(methodName)) continue;
                    const recvType = checker.getTypeAtLocation(expr.expression);
                    const recvSym = recvType && (recvType.symbol || recvType.aliasSymbol);
                    const recvName = recvSym && recvSym.getName && recvSym.getName();
                    if (recvName === className) {
                      context.report({ node, messageId: 'noTop', data: { name: `${className}.${methodName}` } });
                      return;
                    }
                  }
                }
              }
            } catch {}
          }
        }

        // 2) Same-file indirection: call a known top-level function that eventually calls banned
        const callee = unwrapChain(node).callee;
        if (callee.type === 'Identifier') {
          const localTarget = fnMap[callee.name];
          if (localTarget) {
            const via = functionCallsBannedTransitively_ESTree(localTarget, 1, new Set([localTarget]));
            if (via) {
              context.report({ node, messageId: 'noTop', data: { name: via } });
              return;
            }
          }
        }

        // 3) Cross-file: call a named import that resolves to a function in another file
        if (callee.type === 'Identifier' && haveTS && checker && CROSS_FILE) {
          const tsFn = resolveImportedFunction(callee.name);
          if (tsFn) {
            const via = tsFunctionCallsBannedTransitively(tsFn, 1, new Set([tsFn]));
            if (via) {
              context.report({ node, messageId: 'noTop', data: { name: via } });
              return;
            }
          }
        }

        // 3b) Cross-file: method call at top level (e.g., obj.method()) — resolve via TS
        if (haveTS && checker && CROSS_FILE && (callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression')) {
          try {
            const tsCall = context.parserServices.esTreeNodeToTSNodeMap.get(node);
            if (tsCall && ts.isCallExpression(tsCall)) {
              const sig = checker.getResolvedSignature(tsCall);
              const decl = sig?.declaration;
              if (decl) {
                let fnLike = null;
                if (ts.isMethodDeclaration(decl) || ts.isFunctionDeclaration(decl)) {
                  fnLike = decl;
                } else if (ts.isFunctionExpression(decl) || ts.isArrowFunction(decl)) {
                  fnLike = decl;
                }
                if (fnLike) {
                  collectTopLevelTSFunctions(fnLike.getSourceFile());
                  const via = tsFunctionCallsBannedTransitively(fnLike, 1, new Set([fnLike]));
                  if (via) {
                    context.report({ node, messageId: 'noTop', data: { name: via } });
                    return;
                  }
                }
              }

              // Fallback: resolve property symbol
              const expr = tsCall.expression;
              if (ts.isPropertyAccessExpression(expr)) {
                let sym = checker.getSymbolAtLocation(expr.name);
                if (sym && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
                  sym = checker.getAliasedSymbol(sym);
                }
                const decls = sym?.getDeclarations?.() || [];
                for (const d of decls) {
                  let fnLike = null;
                  if (ts.isMethodDeclaration(d) || ts.isFunctionDeclaration(d)) {
                    fnLike = d;
                  } else if (ts.isVariableDeclaration(d) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) {
                    fnLike = d.initializer;
                  }
                  if (fnLike) {
                    collectTopLevelTSFunctions(fnLike.getSourceFile());
                    const via = tsFunctionCallsBannedTransitively(fnLike, 1, new Set([fnLike]));
                    if (via) {
                      context.report({ node, messageId: 'noTop', data: { name: via } });
                      return;
                    }
                  }
                }
              }
            }
          } catch {}
        }

        // 4) Top-level IIFE in this file: (() => isLW())()
        if (callee.type === 'FunctionExpression' || callee.type === 'ArrowFunctionExpression') {
          const via = functionCallsBannedTransitively_ESTree(callee, 1, new Set([callee]));
          if (via) {
            context.report({ node, messageId: 'noTop', data: { name: via } });
            return;
          }
        }

        // No report from reachability; nothing to do.
      },
    };
  },
};
