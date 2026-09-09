{
  description = "A project by ?.";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs =
    inputs@{
      flake-parts,
      self,
      ...
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ ];
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      perSystem =
        {
          config,
          self',
          inputs',
          pkgs,
          system,
          ...
        }:
        {
          _module.args.pkgs = import self.inputs.nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
          # Per-system attributes can be defined here. The self' and inputs'
          # module parameters provide easy access to attributes of the same
          # system.

          # Equivalent to  inputs'.nixpkgs.legacyPackages.hello;
          packages.default = pkgs.hello;
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              nixfmt
              typescript-go
              typescript-language-server
              just
              (pkgs.writeShellScriptBin "vercel" ''
                exec ${pkgs.nodejs}/bin/npx -y vercel@latest "$@"
              '')
              (pkgs.writeShellScriptBin "neon" ''
                exec ${pkgs.nodejs}/bin/npx -y neonctl@latest "$@"
              '')
              nodejs_24
              yarn
              postgresql
            ];
            shellHook = "";
          };
        };
      flake = {
        # The usual flake attributes can be defined here, including system-
        # agnostic ones like nixosModule and system-enumerating ones, although
        # those are more easily expressed in perSystem.
      };
    };
}
