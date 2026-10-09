#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建符合 Unix 路径标准的 ZIP 包用于 itch.io 上传
"""
import os
import zipfile

def create_itch_zip(output_name='itch_20260922_v2.zip'):
    """创建 itch.io 兼容的 ZIP 包"""
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # 需要打包的文件和目录
    files_to_include = [
        'index.html',
        'manifest.json',
        'diagnose.js',
    ]

    dirs_to_include = [
        'css',
        'js',
        'assets',
        'fonts',
    ]

    # 需要排除的文件模式
    exclude_patterns = [
        '__pycache__',
        '.DS_Store',
        'node_modules',
        '.git',
    ]

    output_path = os.path.join(base_dir, output_name)

    print(f"Creating ZIP: {output_name}")

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # 添加单个文件
        for file_name in files_to_include:
            file_path = os.path.join(base_dir, file_name)
            if os.path.exists(file_path):
                # 使用 Unix 风格的正斜杠
                arcname = file_name.replace('\\', '/')
                zipf.write(file_path, arcname)
                print(f"  + {arcname}")

        # 添加目录
        for dir_name in dirs_to_include:
            dir_path = os.path.join(base_dir, dir_name)
            if not os.path.exists(dir_path):
                print(f"  - Directory not found: {dir_name}")
                continue

            for root, dirs, files in os.walk(dir_path):
                # 过滤排除的目录
                dirs[:] = [d for d in dirs if d not in exclude_patterns]

                for file in files:
                    # 跳过排除的文件
                    if any(pattern in file for pattern in exclude_patterns):
                        continue

                    file_path = os.path.join(root, file)
                    # 计算相对路径并转换为 Unix 风格
                    arcname = os.path.relpath(file_path, base_dir).replace('\\', '/')
                    zipf.write(file_path, arcname)
                    print(f"  + {arcname}")

    # 验证生成的 ZIP
    print(f"\nVerifying ZIP structure:")
    with zipfile.ZipFile(output_path, 'r') as zipf:
        names = zipf.namelist()
        print(f"  Total files: {len(names)}")
        print(f"  First 10 files:")
        for name in names[:10]:
            print(f"    - {name}")
            if '\\' in name:
                print(f"      WARNING: Contains backslash!")

    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\nDone! File size: {file_size:.2f} MB")
    print(f"Path: {output_path}")

if __name__ == '__main__':
    create_itch_zip()
