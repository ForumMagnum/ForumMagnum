#!/bin/bash

# Define the Material UI vendor folder location
MATERIAL_UI_DIR="/Users/habryka/Lightcone/ForumMagnum/packages/lesswrong/lib/vendor/@material-ui"
CODEBASE_DIR="/Users/habryka/Lightcone/ForumMagnum"

# Check if the Material UI directory exists
if [ ! -d "$MATERIAL_UI_DIR" ]; then
    echo "Error: Material UI directory '$MATERIAL_UI_DIR' does not exist."
    exit 1
fi

# Create a temporary file to log removed files
REMOVED_LOG=$(mktemp)
KEPT_LOG=$(mktemp)

echo "Analyzing Material UI files for usage in the codebase..."
echo "This may take some time depending on the size of your codebase."

# Find all files in the Material UI vendor folder
find "$MATERIAL_UI_DIR" -type f | while read -r file; do
    # Extract the relative path from the Material UI directory
    rel_path=${file#$MATERIAL_UI_DIR/}
    
    # Create search patterns based on different import styles
    # We'll look for both direct imports and imports via the index
    component_name=$(basename "$file" | sed -E 's/\.(jsx?|tsx?)$//')
    component_dir=$(dirname "$rel_path" | sed 's|^core/src/||;s|^icons/src/||')
    
    # Create various patterns to search for
    patterns=(
        # Direct path imports from @material-ui
        "from ['\"]\@material-ui/${rel_path%.*}['\"]" 
        "from ['\"]\@material-ui/${rel_path%.*}\.(jsx?|tsx?)['\"]"
        "from ['\"]\@/lib/vendor/\@material-ui/${rel_path%.*}['\"]"
        "from ['\"]\@/lib/vendor/\@material-ui/${rel_path%.*}\.(jsx?|tsx?)['\"]"
        
        # Component imports
        "from ['\"]\@material-ui/[^'\"]*/${component_name}['\"]"
        "from ['\"]\@/lib/vendor/\@material-ui/[^'\"]*/${component_name}['\"]"
    )
    
    is_used=false
    
    # Check each pattern
    for pattern in "${patterns[@]}"; do
        # Use grep to check if the file is imported anywhere in the codebase
        if grep -q -E "$pattern" -r --include="*.{js,jsx,ts,tsx}" "$CODEBASE_DIR"; then
            is_used=true
            break
        fi
    done
    
    # Special case for SvgIcon which is used indirectly by icon components
    if [[ "$file" == *"/SvgIcon/"* ]] && grep -q -E "from ['\"]\@material-ui/icons" -r --include="*.{js,jsx,ts,tsx}" "$CODEBASE_DIR"; then
        is_used=true
    fi
    
    # If the file is not used, remove it
    if [ "$is_used" = false ]; then
        echo "Removing unused file: $file"
        echo "$file" >> "$REMOVED_LOG"
        rm "$file"
    else
        echo "Keeping used file: $file"
        echo "$file" >> "$KEPT_LOG"
    fi
done

# Clean up empty directories
find "$MATERIAL_UI_DIR" -type d -empty -delete

echo "Clean-up complete!"
echo "$(wc -l < "$REMOVED_LOG") files were removed."
echo "$(wc -l < "$KEPT_LOG") files were kept."
echo "Removed files are logged in: $REMOVED_LOG"
echo "Kept files are logged in: $KEPT_LOG" 