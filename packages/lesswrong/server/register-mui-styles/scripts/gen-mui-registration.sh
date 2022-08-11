#!/usr/bin/env bash
# See note in ../index.ts.

set -e

MUI_ROOT="$HOME/src/material-ui/packages/material-ui/src"
(
	cd "$HOME/src/material-ui";
   [[ $(git branch == "v3.x" ]]
) || (
	>&2 echo Clone the material-ui git repo and check out branch v3.x.
	exit 1
)

if ! command -v kak >/dev/null; then
	>&2 echo Please install '"'kakoune'"' from your package manager.
	exit 1
fi

component="$1"

[ "$component" ]
[ "$component" ~= [A-Za-z]+] # Otherwise unsafe!

MUI_SRC="$MUI_ROOT"/"$component"/"$component".js
[ -f "$MUI_SRC" ] || (
	>&2 echo Warning: Can''t  find source for $component at $MUI_SRC.
	exit 0
)

# Wrapper around `kak -f` supporting multiline commands and comments.
function kakfilter() {
	str=$(<<<"$1" sed 's/^\s*//' | sed 's/\s*#.*$//' | grep . | tr -d '\n')
   kak -f "$str"
}

if ! <"$MUI_SRC" grep -q 'palette' > /dev/null; then
	>&2 echo Info: $component does not use palette.
	exit 0
fi

echo import $component from "'@material-ui/core/$component';"

<"$MUI_SRC" 2>/dev/null kakfilter '
	/^export const styles<ret>gh # Find line with "styles" export
	wd                           # Delete "export"
	o  //deleteme<ret>  /*deleteme*/<esc>kkgh # Supress errors below.
	GlMGl"ad%d"aP                # Delete everything else in the file.
	%<a-s><a-k> <ret>x           # Select lines within returned style object.
	Z<a-k>/\*[^*]*\*/<ret>d      # Delete /**/ comments.
   z
	Zs//[^\n]*$<ret>d            # Delete // comments.
	z
   # TODO: Should select prop:val, not just lines.
	# We could use kak-tree for this. Or, like, an actual JS parser....
                                #%s{<ret>
	%<a-s><a-k> <ret>x           # Select lines within returned style object.
	<a-K>(palette)|[{}]<ret>d	  # Delete lines without color styles or {}.
	%s\{[\s]*\}<ret><a-x>d       # Delete now-empty rules.
	%s\{[\s]*\}<ret><a-x>d       # Repeat a couple times for nested rules.
	%s\{[\s]*\}<ret><a-x>d       # (This one probably errors).
' | kakfilter '
	gg? = <ret>cregisterComponent("'"Mui$component"'", '"$component"', { styles: <esc>ge<a-/>;<ret>i})
'
