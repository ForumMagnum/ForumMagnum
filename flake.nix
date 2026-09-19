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
      };
    };
}
