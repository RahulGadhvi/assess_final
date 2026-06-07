import os

def generate_codebase_report(root_dir=".", output_file="codebase_snapshot.txt"):
    # Folders we want to completely skip to avoid noise
    ignored_dirs = {".git", "node_modules", ".next", "out", "dist", "coverage"}
    # File extensions we care about
    valid_extensions = {".ts", ".tsx", ".json", ".prisma", ".js"}

    with open(output_file, "w", encoding="utf-8") as out:
        out.write("==================================================\n")
        out.write("         ASSESS APP CODEBASE CONFIGURATION MAP    \n")
        out.write("==================================================\n\n")

        # 1. Generate & Write the Visual Folder Tree Structure
        out.write("## 1. DIRECTORY TREE STRUCTURE\n")
        out.write("--------------------------------------------------\n")
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]
            level = root.replace(root_dir, '').count(os.sep)
            indent = ' ' * 4 * level
            out.write(f"{indent}📁 {os.path.basename(root) or root_dir}/\n")
            sub_indent = ' ' * 4 * (level + 1)
            for f in files:
                if any(f.endswith(ext) for ext in valid_extensions):
                    out.write(f"{sub_indent}📄 {f}\n")
        
        out.write("\n\n## 2. RELEVANT FILE CONTENTS\n")
        out.write("--------------------------------------------------\n")

        # 2. Iterate and print specific, important configuration and routing tracks
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            
            for f in files:
                file_path = os.path.join(root, f)
                ext = os.path.splitext(f)[1]

                # We only want source code files inside prisma or app directories
                if ext in valid_extensions and ("src/app" in file_path or "prisma" in file_path):
                    out.write(f"\n\nPATH: {file_path}\n")
                    out.write("=" * 40 + "\n")
                    try:
                        with open(file_path, "r", encoding="utf-8") as src_file:
                            out.write(src_file.read())
                    except Exception as e:
                        out.write(f"[ERROR READING FILE]: {str(e)}\n")
                    out.write("\n" + "=" * 40 + "\n")

    print(f"✅ Success! Snapshot compiled into: '{output_file}'")

if __name__ == "__main__":
    generate_codebase_report()