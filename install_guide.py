#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
视频剪辑工具安装指南脚本
用于检查环境和安装依赖
"""

import sys
import subprocess
import os

def check_python_version():
    """检查Python版本"""
    version = sys.version_info
    print(f"Python版本: {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python版本过低，需要Python 3.7或更高版本")
        return False
    print("✅ Python版本满足要求")
    return True

def check_command(command, name):
    """检查命令是否存在"""
    try:
        subprocess.run(command, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"✅ {name} 已安装")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ 未找到 {name}")
        return False
    except FileNotFoundError:
        print(f"❌ 未找到 {name}")
        return False

def install_package(package, method="pip"):
    """安装Python包"""
    try:
        if method == "pip":
            subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)
        elif method == "conda" and check_command("conda --version", "conda"):
            subprocess.run(["conda", "install", "-y", package], check=True)
        print(f"✅ {package} 安装成功")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ {package} 安装失败")
        return False
    except FileNotFoundError:
        print(f"❌ 未找到 {method} 命令")
        return False

def main():
    print("=== 视频剪辑工具安装检查 ===\n")
    
    # 检查Python版本
    if not check_python_version():
        print("\n请升级Python到3.7或更高版本")
        return
    
    print()
    
    # 检查必要命令
    check_command("ffmpeg -version", "FFmpeg")
    check_command("pip --version", "pip")
    
    print("\n=== 安装Python依赖 ===\n")
    
    # 读取requirements.txt
    if not os.path.exists("requirements.txt"):
        print("❌ 找不到 requirements.txt 文件")
        return
    
    with open("requirements.txt", "r") as f:
        packages = [line.strip() for line in f.readlines() if line.strip() and not line.startswith("#")]
    
    print("需要安装的包:")
    for package in packages:
        print(f"  - {package}")
    
    print("\n开始安装...")
    
    # 尝试安装依赖
    failed_packages = []
    for package in packages:
        print(f"\n安装 {package}...")
        # 首先尝试正常安装
        if not install_package(package):
            # 如果失败，尝试使用预编译版本
            if "pandas" in package.lower():
                print("尝试安装预编译版本...")
                if not install_package("--only-binary=all " + package):
                    failed_packages.append(package)
            else:
                failed_packages.append(package)
    
    if failed_packages:
        print(f"\n❌ 以下包安装失败:")
        for package in failed_packages:
            print(f"  - {package}")
        print("\n请手动安装这些包，或参考README.md中的故障排除指南")
    else:
        print("\n✅ 所有依赖安装完成!")
        print("\n现在可以运行应用:")
        print("  python app.py")

if __name__ == "__main__":
    main()