#!/bin/bash
set -e
echo "# Project Analysis Snapshot" > code_snapshot.txt
echo "## Directory Structure" >> code_snapshot.txt
find app components lib stores -type f \( -name "*.ts" -o -name "*.tsx" \) | sort >> code_snapshot.txt
echo -e "\n## File Contents" >> code_snapshot.txt
while IFS= read -r file; do
    echo -e "\n### $file" >> code_snapshot.txt
    cat "$file" >> code_snapshot.txt
done < <(find app components lib stores -type f \( -name "*.ts" -o -name "*.tsx" \) | sort)
