#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
狼人杀竞技场Web服务器启动脚本
Werewolf Arena Web Server Launcher
"""

import sys
import os
import subprocess
import webbrowser
import time

def check_dependencies():
    """检查依赖是否已安装"""
    try:
        import flask
        import flask_cors
        return True
    except ImportError:
        print("❌ 缺少依赖包，正在安装...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask', 'flask-cors'])
            print("✅ 依赖安装完成")
            return True
        except subprocess.CalledProcessError:
            print("❌ 依赖安装失败，请手动运行: pip install flask flask-cors")
            return False

def main():
    print("🐺 狼人杀竞技场 - Werewolf Arena")
    print("=" * 50)

    # 检查依赖
    if not check_dependencies():
        return

    # 检查必要文件
    required_files = ['web_server.py', 'home.html', 'main.py']
    missing_files = [f for f in required_files if not os.path.exists(f)]

    if missing_files:
        print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
        return

    print("✅ 检查完成，正在启动Web服务器...")
    print()

    # 延迟后自动打开浏览器（使用配置文件）
    def open_browser():
        try:
            # 尝试使用延迟配置
            from backend.src.config.timing_loader import get_delay
            delay = get_delay("ui_animation") / 1000  # 转换为秒
        except:
            delay = 2  # 默认2秒
        time.sleep(delay)
        try:
            webbrowser.open('http://localhost:8081')
            print("🌐 已自动打开浏览器")
        except:
            print("📝 请手动访问: http://localhost:8081")

    # 在后台线程中打开浏览器
    import threading
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    print("🚀 启动命令: python3 web_server.py")
    print("🌐 访问地址: http://localhost:8081")
    print("📖 API文档: http://localhost:8081/start-game (POST)")
    print()
    print("按 Ctrl+C 停止服务器")
    print("=" * 50)

    # 启动Web服务器
    try:
        from web_server import app
        app.run(
            host='0.0.0.0',
            port=8081,
            debug=False,
            threaded=True,
            use_reloader=False
        )
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")

if __name__ == '__main__':
    main()