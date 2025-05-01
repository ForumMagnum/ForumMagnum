/* eslint-disable no-console */
/**
 * Code‑gen script that rebuilds (very) basic TanStack forms from the
 * form‑spec parts of collection schemas.
 *
 * USAGE:
 *    yarn repl dev packages/lesswrong/server/scripts/migrateSmartForms.ts "generateDiffedForms()"
 *
 * OUTPUT:
 *    ./generatedForms-diff.tsx  – contains one TanStack form component per
 *    collection listed in `collections`.
 *
 * Caveats / TODOs are inserted inline where we intentionally skip logic
 * (e.g. zod validation, hidden‑functions, Editor callbacks, etc.).
 */

import { getSchema, getSimpleSchema } from '@/lib/schema/allSchemas';
import { formProperties } from '@/lib/vulcan-forms/schema_utils';
import * as fs from 'fs';
import * as path from 'path';
import SimpleSchema from 'simpl-schema';
import util from 'util';
import { exec as execSync } from 'child_process';
import { forumTypeSetting } from '@/lib/instanceSettings';
import { defaultEditorPlaceholder } from '@/lib/editor/make_editable';
import { collectionNameToTypeName } from '@/lib/generated/collectionTypeNames';
import { userOwns } from '@/lib/vulcan-users/permissions';

const exec = util.promisify(execSync);

function mergeStringsWithDiff(
  string1: string,
  string2: string,
  minMatch = 2
): string {
  const lines1 = string1.split('\n');
  const lines2 = string2.split('\n');
  const result: string[] = [];

  let i = 0, j = 0;
  const len1 = lines1.length, len2 = lines2.length;

  while (i < len1 && j < len2) {
    // Perfect sync?
    if (lines1[i] === lines2[j]) {
      result.push(lines1[i]);
      i++; j++;
      continue;
    }

    // Mismatch → look for next region of >= minMatch consecutive matches
    const lookI = len1 - i - minMatch;
    const lookJ = len2 - j - minMatch;
    type Candidate = { nextI: number; nextJ: number; cost: number };
    let best: Candidate | null = null;

    // Case A: skip ahead in string1
    for (let delta = 1; delta <= lookI; delta++) {
      let ok = true;
      for (let k = 0; k < minMatch; k++) {
        if (lines1[i + delta + k] !== lines2[j + k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        const cand = { nextI: i + delta, nextJ: j, cost: delta };
        if (!best || cand.cost < (best as Candidate).cost) best = cand;
        break;  // no point scanning larger delta once we’ve found the first
      }
    }

    // Case B: skip ahead in string2
    for (let delta = 1; delta <= lookJ; delta++) {
      let ok = true;
      for (let k = 0; k < minMatch; k++) {
        if (lines1[i + k] !== lines2[j + delta + k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        const cand = { nextI: i, nextJ: j + delta, cost: delta };
        if (!best || cand.cost < best.cost) best = cand;
        break;
      }
    }

    // Case C: skip ahead in *both* (sync offset-by-offset)
    const bothLimit = Math.min(lookI, lookJ);
    for (let delta = 1; delta <= bothLimit; delta++) {
      let ok = true;
      for (let k = 0; k < minMatch; k++) {
        if (lines1[i + delta + k] !== lines2[j + delta + k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        const cand = { nextI: i + delta, nextJ: j + delta, cost: delta * 2 };
        if (!best || cand.cost < best.cost) best = cand;
        break;
      }
    }

    // Emit one big conflict block covering everything up to that sync (or to end)
    result.push('<<<<<<< VERSION 1');
    const endI = best ? best.nextI : len1;
    const endJ = best ? best.nextJ : len2;
    for (let x = i; x < endI; x++) {
      result.push(lines1[x]);
    }
    result.push('=======');
    for (let y = j; y < endJ; y++) {
      result.push(lines2[y]);
    }
    result.push('>>>>>>> END');

    if (best) {
      // jump pointers to just before the next matched region
      i = best.nextI;
      j = best.nextJ;
    } else {
      // no sync found → consume everything
      i = len1;
      j = len2;
    }
  }

  // any trailing remainder
  if (i < len1 || j < len2) {
    result.push('<<<<<<< VERSION 1');
    while (i < len1) result.push(lines1[i++]);
    result.push('=======');
    while (j < len2) result.push(lines2[j++]);
    result.push('>>>>>>> END');
  }

  return result.join('\n');
}




function isNonTrivialSimpleSchemaType(fieldSimpleSchemaType: DerivedSimpleSchemaType<SchemaType<CollectionNameString>>[string]['type'], fieldSchema: CollectionFieldSpecification<any>): boolean {
  return (typeof fieldSimpleSchemaType.singleType !== 'function')
    || fieldSimpleSchemaType.singleType === Object
    || (fieldSimpleSchemaType.singleType === Array && !!fieldSchema.graphql?.validation?.simpleSchema)
    || fieldSimpleSchemaType.singleType instanceof SimpleSchema;
}

function inlineFormField<T>(key: string, value: T, fieldName: string, collectionName: string, skipJsxLiteralConversion = false): T extends undefined ? undefined : string {
  type ReturnType = T extends undefined ? undefined : string;

  if (value === undefined) return undefined as ReturnType;

  if (['hintText', 'inputPrefix'].includes(key) && typeof value === 'function') {
    value = value();

    if (value === defaultEditorPlaceholder) {
      value = `{defaultEditorPlaceholder}` as T;
      // Early return before `jsxLiteral` call to avoid it being stringified further
      return `${key}=${value}` as ReturnType;
    }
  }

  if (key === 'options' && typeof value === 'function' && fieldName !== 'votingSystem') {
    value = value();
  }

  let valueStr = (skipJsxLiteralConversion ? value : jsxLiteral(value)) as string;
  if (valueStr.includes('[Function: defaultLocalStorageIdGenerator]')) {
    valueStr = valueStr.replace('[Function: defaultLocalStorageIdGenerator]', `getDefaultLocalStorageIdGenerator('${collectionName}')`);
  }

  return `${key}=${valueStr}` as ReturnType;
}

const collections = [
  'Localgroups',
  'CurationNotices',
  'Comments',
  'ForumEvents',
  'JargonTerms',
  'Conversations',
  'Messages',
  'ModerationTemplates',
  'Users',
  'Posts',
  'RSSFeeds',
  'PetrovDayActions',
  'Books',
  'Chapters',
  'Collections',
  'Sequences',
  'Spotlights',
  'ModeratorActions',
  'Reports',
  'UserRateLimits',
  'SurveySchedules',
  'Tags',
  'MultiDocuments',
  'TagFlags',
] as const;

/**
 * Mapping from legacy Vulcan control names to their TanStack
 * counterparts.  Unknown controls fall back to a guessed name
 * ('TanStack' + control) *and* we emit a TODO comment.
 */
const controlMap: Record<string, string> = {
  MuiTextField: 'TanStackMuiTextField',
  FormUserMultiselect: 'TanStackUserMultiselect',
  EditorFormComponent: 'TanStackEditor',
  LocationFormComponent: 'TanStackLocation',
  ImageUpload: 'TanStackImageUpload',
  MultiSelectButtons: 'TanStackMultiSelectButtons',
  FormComponentMultiSelect: 'TanStackMultiSelect',
  checkbox: 'TanStackCheckbox',
  Checkbox: 'TanStackCheckbox',
};


const excludedFormFieldPropNames: typeof formProperties[number][] = ['form', 'group', 'order', 'control', 'tooltip', 'optional', 'allowedValues', 'regEx', 'blackbox', 'defaultValue'];
const excludedFormFieldPropNameSet = new Set(excludedFormFieldPropNames);

const outerFormFieldPropNames = formProperties.filter(prop => !excludedFormFieldPropNameSet.has(prop));

const innerFormFieldPropNames = [
  'hintText',
  'fieldName',
  'collectionName',
  'commentEditor',
  'commentStyles',
  'hideControls',
  'fullWidth',
  'options',
  'stringVersionFieldName',
  'labels',
  'multiLine',
  'rows',
  'below',
  'croppingAspectRatio',
  'variant',
  'formVariant',
  'disabled',
  'inputPrefix',
  'heading',
  'smallBottomMargin',
  'useDocumentAsUser',
  'separator',
  'multiselect',
  'hideClear',
  'horizontal',
] as const;

/**
 * For ad‑hoc stringification of literal values into JSX.
 *  – strings => quoted
 *  – objects / arrays => JSON.stringify
 *  – functions => TODO comment
 */
function jsxLiteral(value: any): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return `{${value}}`;
  if (typeof value === 'function') {
    return '{/* TODO: replace with function value */}';
  }
  const str = `{${util.inspect(value)}}`;
  return str;
}

/**
 * Resolve which TanStack component to use for a field.
 *  1. explicit control
 *  2. fallback heuristic (same as FormComponent.getInputType logic)
 */
function getComponentName(fieldName: string, fieldSpec: DerivedSimpleSchemaFieldType, collectionName: string): { component: string; props?: string[]; todo?: string } {
  const control = fieldSpec.control as string;

  // 1. direct mapping
  if (control) {
    if (controlMap[control]) {
      const knownProps: string[] = [];
      if (control === 'EditorFormComponent') {
        knownProps.push(inlineFormField('name', fieldName, fieldName, collectionName));
        knownProps.push(inlineFormField('formType', '{formType}', fieldName, collectionName, true));
        knownProps.push(inlineFormField('document', '{form.state.values}', fieldName, collectionName, true));
        knownProps.push(inlineFormField('addOnSubmitCallback', '{addOnSubmitCallback}', fieldName, collectionName, true));
        knownProps.push(inlineFormField('addOnSuccessCallback', '{addOnSuccessCallback}', fieldName, collectionName, true));
      }
      return { component: controlMap[control], props: knownProps };
    } else {
      // Unknown control – guess a name and emit TODO
      return {
        component: `TanStack${control}`,
        todo: `{/* TODO: '${control}' not yet ported - implement ${`TanStack${control}`} */}`,
      };
    }
  }

  // 2. heuristics on datatype
  // fieldSpec.type.definitions?.[0]?.type || 
  const fieldType = fieldSpec.type?.singleType;

  if (fieldType === Number) return {
    component: 'TanStackMuiTextField',
    props: [inlineFormField('type', 'number', fieldName, collectionName)],
  };

  if (fieldType === Boolean) return {
    component: 'TanStackCheckbox'
  };

  if (fieldType === Date) return {
    component: 'TanStackMuiTextField',
    props: [inlineFormField('type', 'date', fieldName, collectionName), inlineFormField('InputLabelProps', { shrink: true }, fieldName, collectionName)],
  };

  // default text
  return { component: 'TanStackMuiTextField' };
}

function getCanCreateTodo(fieldName: string, schemaFieldSpec: CollectionFieldSpecification<any>) {
  const canCreate = schemaFieldSpec.graphql?.canCreate;
  if (!canCreate || !Array.isArray(canCreate) || ((canCreate.includes('guests') || canCreate.includes('members')))) {
    return undefined;
  }

  return `{/* TODO: canCreate gated to ${canCreate.join(', ')} - implement conditional visibility for ${fieldName} */}`;
}

function getCanUpdateTodo(fieldName: string, schemaFieldSpec: CollectionFieldSpecification<any>) {
  const canUpdate = schemaFieldSpec.graphql?.canUpdate;
  if (!canUpdate || !Array.isArray(canUpdate) || ((canUpdate.includes('guests') || canUpdate.includes('members') || canUpdate.includes(userOwns)))) {
    return undefined;
  }

  return `{/* TODO: canUpdate gated to ${canUpdate.join(', ')} - implement conditional visibility for ${fieldName} */}`;
}

/* ---------------  MAIN LOOP ---------------------------------------- */

export function generateForms() {
  console.log(`Generating forms for ${forumTypeSetting.get()} at ${new Date().toISOString()}`);
  let output = `/* eslint-disable */
/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    !!! AUTO-GENERATED FILE - DO NOT EDIT BY HAND !!!
    Generated by scripts/generateTanStackForms.ts
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { Components } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { preferredHeadingCase } from '@/themes/forumTheme';
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator } from '@/lib/editor/make_editable';

/* Shared styles for all generated forms */
const sharedFieldStyles = defineStyles('GeneratedFormFieldStyles', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
}));
`;

  for (const collectionName of collections) {
    /* ------------------------------------------ */
    /* Fetch and prepare schema                   */
    /* ------------------------------------------ */
    const schema = getSimpleSchema(collectionName);
    const collectionSchema = getSchema(collectionName);
    if (!schema?._schema) {
      console.warn(`⛔️  No schema found for ${collectionName}. Skipping.`);
      continue;
    }

    // Flatten to Array of [fieldName, fieldSpec]
    const fields = Object.entries(schema._schema);

    // Only keep fields that have a `form` key
    const formFieldNames = new Set(Object.keys(collectionSchema).filter(fieldName => !!(collectionSchema[fieldName] as AnyBecauseObsolete).form));
    const formFields = Object.entries(schema._schema)
      .filter(([fieldName, fieldSpec]) => formFieldNames.has(fieldName) && fieldSpec.hidden !== true)
      .sort(([, a], [, b]) => (a?.order ?? 9999) - (b?.order ?? 9999));

    let anyEditableFields = false;

    // Derive groups: name -> { groupSpec, fieldList[] }
    type GroupInfo = {
      spec?: FormGroupType<CollectionNameString>; // the object returned by group()
      fields: Array<[string, DerivedSimpleSchemaFieldType]>;
    };
    const groups = new Map<string, GroupInfo>();

    for (const [fieldName, spec] of formFields) {
      const groupFn = spec.group;
      const groupObj = groupFn?.();
      const groupName = groupObj?.name ?? 'default';

      if (!groups.has(groupName)) {
        groups.set(groupName, { spec: groupObj, fields: [] });
      }
      if (spec.editableFieldOptions) {
        anyEditableFields = true;
      }
      groups.get(groupName)!.fields.push([fieldName, spec]);
    }

    /* ------------------------------------------ */
    /* Generate TSX for this collection           */
    /* ------------------------------------------ */
    const className = `${collectionName}Form`;

    output += `
/* ================================================================
    ${collectionName}
    ================================================================
*/

const formStyles = defineStyles('${className}', (theme: ThemeType) => ({
  fieldWrapper: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  submitButton: submitButtonStyles(theme),
}));

export const ${className} = ({
  initialData,
  currentUser,
  onSuccess,
}: {
  initialData?: Update${collectionNameToTypeName[collectionName]}DataInput & { _id: string };
  currentUser: UsersCurrent;
  onSuccess: (doc: ${collectionName}InvalidMutationFragment) => void;
}) => {
  const classes = useStyles(formStyles);
  const { LWTooltip, Error404 } = Components;

  const formType = initialData ? 'edit' : 'new';

  ${anyEditableFields ? `
  const {
    onSubmitCallback,
    onSuccessCallback,
    addOnSubmitCallback,
    addOnSuccessCallback
    } = useEditorFormCallbacks<${collectionName}InvalidMutationFragment>();
  `: ''}

  const { create } = useCreate({
    collectionName: '${collectionName}',
    fragmentName: '${collectionName}InvalidMutationFragment', // TODO: use correct fragment type
  });

  const { mutate } = useUpdate({
    collectionName: '${collectionName}',
    fragmentName: '${collectionName}InvalidMutationFragment', // TODO: use correct fragment type
  });

  /* ---- TanStack form instance -------------------------------- */
  const form = useForm({
    defaultValues: {
      ...initialData,
    },
    onSubmit: async ({ value, formApi }) => {${anyEditableFields ? `
      await onSubmitCallback.current?.();\n`: ''}
      let result: ${collectionName}InvalidMutationFragment;

      if (formType === 'new') {
        const { data } = await create({ data: value });
        result = data?.create${collectionNameToTypeName[collectionName]}.data;
      } else {
        const updatedFields = getUpdatedFieldValues(formApi);
        const { data } = await mutate({
          selector: { _id: initialData?._id },
          data: updatedFields,
        });
        result = data?.update${collectionNameToTypeName[collectionName]}.data;
      }
      ${anyEditableFields ? `
      onSuccessCallback.current?.(result);`: ''}
      
      onSuccess(result);
    },
  });

  if (formType === 'edit' && !initialData) {
    return <Error404 />;
  }

  return (
    <form className="vulcan-form" onSubmit={(e) => {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
    }}>`;

    /*  ----------  Group rendering -------------------------- */
    // Ensure default group comes first
    const sortedGroups = [...groups.entries()].sort(([nameA, a], [nameB, b]) => {
      if (nameA === 'default') return -1;
      if (nameB === 'default') return 1;
      const orderA = a.spec?.order ?? 0;
      const orderB = b.spec?.order ?? 0;
      return orderA - orderB;
    });

    for (const [groupName, { spec: groupSpec, fields: groupFields }] of sortedGroups) {
      // Choose layout component
      const layoutName = groupSpec?.layoutComponent
        ? `Components.${groupSpec.layoutComponent}`
        : 'Components.FormGroupLayout';

      const groupProps: string[] = [];
      if (groupSpec?.label) groupProps.push(`label=${jsxLiteral(groupSpec.label)}`);
      if (groupSpec?.startCollapsed !== undefined)
        groupProps.push(`collapsed={${!!groupSpec.startCollapsed}}`);
      if (groupSpec?.hideHeader) groupProps.push(`hideHeader`);
      if (groupSpec?.layoutComponentProps)
        groupProps.push(
          `/* TODO: port layoutComponentProps: ${JSON.stringify(
            groupSpec.layoutComponentProps
          )} */`
        );

      if (groupName !== 'default' && groupFields.length > 0) {
        output += `      <${layoutName} ${groupProps.join(' ')}>`;
      }

      /*  ----------  Fields within group --------------- */
      for (const [fieldName, fieldSpec] of groupFields) {
        // Handle hidden prop
        const hiddenProp = fieldSpec.hidden;
        if (hiddenProp === true) {
          continue; // omit entirely
        }

        // Determine component + TODO
        const { component, props: knownProps = [], todo } = getComponentName(fieldName, fieldSpec, collectionName);

        // Collect props
        const props: string[] = [`field={field}`, ...knownProps]; // 'field' will come from <form.Field/>

        const formObj = fieldSpec ?? {};
        const formSub = formObj.form ?? {};

        for (const propName of outerFormFieldPropNames) {
          const propValue = formObj[propName as keyof typeof formObj];
          if (propValue !== undefined) {
            props.push(inlineFormField(propName, propValue, fieldName, collectionName));
          }
        }

        for (const propName of innerFormFieldPropNames) {
          const propValue = formSub[propName];
          if (propValue !== undefined) {
            props.push(inlineFormField(propName, propValue, fieldName, collectionName));
          }
        }

        if (!formObj.editableFieldOptions) {
          const label = formSub.label ?? formObj.label ?? schema.get(fieldName, 'label');
          props.push(inlineFormField('label', label, fieldName, collectionName));
        }

        // Tooltip handling
        const tooltipStart = formObj.tooltip
          ? `<LWTooltip title=${jsxLiteral(formObj.tooltip)} placement="left-start" inlineBlock={false}>`
          : '';
        const tooltipEnd = formObj.tooltip ? `</LWTooltip>` : '';

        // Validation TODO
        const validationTodo = isNonTrivialSimpleSchemaType(fieldSpec.type, collectionSchema[fieldName])
          ? `{/* TODO: add custom validation (simpleSchema present) */}`
          : '';

        if (validationTodo) {
          output += `\n        ${validationTodo}`;
        }

        // Conditional visibility TODO (function)
        const hiddenTodo =
          typeof hiddenProp === 'function'
            ? `{/* TODO: custom hidden prop; implement conditional visibility for ${fieldName} */}`
            : '';

        const canCreateTodo = getCanCreateTodo(fieldName, collectionSchema[fieldName]);
        const canUpdateTodo = getCanUpdateTodo(fieldName, collectionSchema[fieldName]);

        if (canCreateTodo) {
          output += `\n        ${canCreateTodo}`;
        }

        if (canUpdateTodo) {
          output += `\n        ${canUpdateTodo}`;
        }

        if (hiddenTodo) {
          output += `\n        ${hiddenTodo}`;
        }

        if (todo) {
          output += `\n        ${todo}`;
        }

        output += `
        <div className={${formObj.editableFieldOptions ? 'classNames("form-component-EditorFormComponent", classes.fieldWrapper)' : 'classes.fieldWrapper'}}>
          <form.Field name="${fieldName}">
            {(field) => (`;

        if (tooltipStart) {
          output += `\n              ${tooltipStart}`;
        }

        output += `\n              <${component}
                ${props.join('\n                ')}
              />`;

        if (tooltipEnd) {
          output += `\n              ${tooltipEnd}`;
        }

        output += `\n            )}
          </form.Field>
        </div>
`;
      }

      if (groupName !== 'default' && groupFields.length > 0) {
        output += `      </${layoutName}>\n`;
      } else {
        output += `\n`;
      }
    }

    const submitVariantProp = collectionName === 'Users'
      ? `\n            variant={isBookUI ? 'outlined' : undefined}`
      : '';

    const submitOnClickProp = collectionName === 'Posts'
      ? `\n            onClick={() => form.setFieldValue('draft', false)}`
      : '';

    /* Submit button */
    output += `
      {/* TODO: check if there's a custom submit component */}
      <div className="form-submit">
        {/* TODO: check if there's a cancel callback - if not, delete this */}
        {/*<Button
          className={classNames("form-cancel", classes.secondaryButton)}
          onClick={(e) => {
            e.preventDefault();
            cancelCallback(document)
          }}
        >
          {cancelLabel}
        </Button>*/}

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button${submitVariantProp}
              type="submit"
              disabled={!canSubmit || isSubmitting}${submitOnClickProp}
              className={classNames("primary-form-submit-button", classes.submitButton)}
            >
              Submit
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
};
`;
  }

  const outFile = path.resolve(process.cwd(), `generatedForms-${forumTypeSetting.get()}.tsx`);
  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`✅  Generated forms written to ${outFile}`);
}

export async function generateDiffedForms() {
  generateForms();
  const res = await exec('yarn gfrepl dev packages/lesswrong/server/scripts/migrateSmartForms.ts "generateForms()"');
  console.log(res);
  // await sleep(15_000);
  const lwForms = fs.readFileSync(path.resolve(process.cwd(), `generatedForms-LessWrong.tsx`), 'utf8');
  const eaForms = fs.readFileSync(path.resolve(process.cwd(), `generatedForms-EAForum.tsx`), 'utf8');

  const diff = mergeStringsWithDiff(lwForms, eaForms);
  fs.writeFileSync(path.resolve(process.cwd(), `generatedForms-diff.tsx`), diff, 'utf8');
  console.log(`✅  Generated diff written to ${path.resolve(process.cwd(), `generatedForms-diff.tsx`)}`);
}
