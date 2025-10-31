#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
狼人杀竞技场Web服务器
Werewolf Arena Web Server
"""

import json
import threading
import time
from flask import Flask, request, jsonify, render_template_string, send_from_directory
from flask_cors import CORS
import os
import sys

# 添加项目路径以便导入游戏模块
sys.path.append('.')

from werewolf.config import DEFAULT_THREADS
from werewolf import logging
from werewolf import game
from werewolf.model import Doctor, SEER, Seer, State, Villager, WEREWOLF, Werewolf
from werewolf.runner import initialize_players, model_to_id
from api_config import api_config

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 存储正在运行的游戏
running_games = {}

# 存储游戏线程对象，用于终止操作
game_threads = {}

# 存储GameMaster实例，用于控制游戏
game_masters = {}

def run_game_standalone(werewolf_model: str, villager_model: str, num_threads: int = DEFAULT_THREADS):
    """独立运行游戏函数，不依赖absl flags"""

    # 检查模型是否启用
    if not api_config.is_model_enabled(werewolf_model):
        print(f"❌ 模型 {werewolf_model} 未启用，请在配置文件中启用")
        return None, None, None

    if not api_config.is_model_enabled(villager_model):
        print(f"❌ 模型 {villager_model} 未启用，请在配置文件中启用")
        return None, None, None

    # 检查API密钥
    werewolf_api_type = api_config.get_model_api_type(werewolf_model)
    villager_api_type = api_config.get_model_api_type(villager_model)

    if werewolf_api_type == "glm":
        glm_key = api_config.get_api_key("glm")
        if not glm_key:
            print("⚠️ 警告: 未设置GLM API密钥")
            print("请在 api_config.json 中配置 GLM_API_KEY")
            print("或设置环境变量: export GLM_API_KEY='your-api-key'")
            print("或访问 https://open.bigmodel.cn/ 获取API密钥")

    if villager_api_type == "glm":
        glm_key = api_config.get_api_key("glm")
        if not glm_key:
            print("⚠️ 警告: 未设置GLM API密钥")
            print("请在 api_config.json 中配置 GLM_API_KEY")
            print("或设置环境变量: export GLM_API_KEY='your-api-key'")
            print("或访问 https://open.bigmodel.cn/ 获取API密钥")

    # 映射模型名称到完整的API标识符
    if villager_model in model_to_id:
        villager_model = model_to_id[villager_model]
    if werewolf_model in model_to_id:
        werewolf_model = model_to_id[werewolf_model]

    # 初始化玩家
    seer, doctor, villagers, werewolves = initialize_players(villager_model, werewolf_model)

    # 准备会话目录和进度保存回调
    log_directory = logging.log_directory()
    session_id = os.path.basename(log_directory)
    state = State(
        villagers=villagers,
        werewolves=werewolves,
        seer=seer,
        doctor=doctor,
        session_id=session_id,
    )

    def _save_progress(state: State, logs):
        logging.save_game(state, logs, log_directory)

    # 创建游戏主控
    gamemaster = game.GameMaster(
        state, num_threads=num_threads, on_progress=_save_progress
    )

    # 初始保存
    _save_progress(state, gamemaster.logs)

    winner = None
    try:
        winner = gamemaster.run_game()
    except Exception as e:
        state.error_message = str(e)
        print(f"Error encountered during game: {e}")

    logging.save_game(state, gamemaster.logs, log_directory)
    print(f"Game logs saved to: {log_directory}")
    print(f"View in browser: http://localhost:8081/?session_id={session_id}")

    return winner, log_directory, session_id


def run_game_with_directory(werewolf_model: str, villager_model: str, num_threads: int, log_directory: str, session_id: str):
    """使用预生成的log_directory和session_id运行游戏"""

    # 检查模型是否启用
    if not api_config.is_model_enabled(werewolf_model):
        print(f"❌ 模型 {werewolf_model} 未启用，请在配置文件中启用")
        return None

    if not api_config.is_model_enabled(villager_model):
        print(f"❌ 模型 {villager_model} 未启用，请在配置文件中启用")
        return None

    # 检查API密钥
    werewolf_api_type = api_config.get_model_api_type(werewolf_model)
    villager_api_type = api_config.get_model_api_type(villager_model)

    if werewolf_api_type == "glm":
        glm_key = api_config.get_api_key("glm")
        if not glm_key:
            print("⚠️ 警告: 未设置GLM API密钥")
            print("请在 api_config.json 中配置 GLM_API_KEY")
            print("或设置环境变量: export GLM_API_KEY='your-api-key'")
            print("或访问 https://open.bigmodel.cn/ 获取API密钥")

    if villager_api_type == "glm":
        glm_key = api_config.get_api_key("glm")
        if not glm_key:
            print("⚠️ 警告: 未设置GLM API密钥")
            print("请在 api_config.json 中配置 GLM_API_KEY")
            print("或设置环境变量: export GLM_API_KEY='your-api-key'")
            print("或访问 https://open.bigmodel.cn/ 获取API密钥")

    # 映射模型名称到完整的API标识符
    if villager_model in model_to_id:
        villager_model = model_to_id[villager_model]
    if werewolf_model in model_to_id:
        werewolf_model = model_to_id[werewolf_model]

    # 初始化玩家
    seer, doctor, villagers, werewolves = initialize_players(villager_model, werewolf_model)

    # 使用传递过来的log_directory和session_id
    state = State(
        villagers=villagers,
        werewolves=werewolves,
        seer=seer,
        doctor=doctor,
        session_id=session_id,
    )

    def _save_progress(state: State, logs):
        logging.save_game(state, logs, log_directory)

    # 创建游戏主控
    gamemaster = game.GameMaster(
        state, num_threads=num_threads, on_progress=_save_progress
    )

    # 初始保存
    _save_progress(state, gamemaster.logs)

    winner = None
    try:
        winner = gamemaster.run_game()
    except Exception as e:
        state.error_message = str(e)
        print(f"Error encountered during game: {e}")

    logging.save_game(state, gamemaster.logs, log_directory)
    print(f"Game logs saved to: {log_directory}")
    print(f"View in browser: http://localhost:8081/?session_id={session_id}")

    return winner

@app.route('/')
def home():
    """首页"""
    try:
        with open('home.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return """
        <h1>狼人杀竞技场</h1>
        <p>首页文件未找到，请确保home.html文件存在</p>
        <p>请运行: <code>python3 web_server.py</code></p>
        """

@app.route('/start-game', methods=['POST'])
def start_game():
    """启动新游戏"""
    try:
        data = request.get_json()
        v_model = data.get('v_models', 'glmz1-flash')
        w_model = data.get('w_models', 'glmz1-flash')

        print(f"Starting game: Villagers={v_model}, Werewolves={w_model}")

        # 使用原有的session_id生成逻辑
        from werewolf import logging
        log_directory = logging.log_directory()
        session_id = os.path.basename(log_directory)

        print(f"Generated session_id: {session_id}, log_directory: {log_directory}")

        # 先在running_games中创建一个占位记录
        running_games[session_id] = {
            'v_model': v_model,
            'w_model': w_model,
            'status': 'initializing',
            'start_time': time.time(),
            'log_directory': log_directory,
            'winner': None,
            'session_id': session_id
        }

        # 在后台线程中启动游戏
        def run_game_thread():
            try:
                # 创建GameMaster实例并保存
                from werewolf import game as game_module
                from werewolf.model import State, Doctor, Seer, Villager, Werewolf
                from werewolf.runner import initialize_players

                # 初始化玩家
                seer, doctor, villagers, werewolves = initialize_players(
                    model_to_id.get(v_model, v_model),
                    model_to_id.get(w_model, w_model)
                )

                # 创建状态
                state = State(
                    villagers=villagers,
                    werewolves=werewolves,
                    seer=seer,
                    doctor=doctor,
                    session_id=session_id,
                )

                def _save_progress(state: State, logs):
                    logging.save_game(state, logs, log_directory)

                # 创建GameMaster实例
                gamemaster = game_module.GameMaster(
                    state, num_threads=DEFAULT_THREADS, on_progress=_save_progress
                )

                # 保存GameMaster实例引用
                game_masters[session_id] = gamemaster

                # 初始保存
                _save_progress(state, gamemaster.logs)

                # 运行游戏
                winner = gamemaster.run_game()

                print(f"Game {session_id} completed. Log directory: {log_directory}")
                print(f"View at: http://localhost:8081/index_live.html?session_id={session_id}")

                # 更新游戏状态
                if session_id in running_games:
                    running_games[session_id]['status'] = 'completed'
                    running_games[session_id]['winner'] = winner

            except Exception as e:
                print(f"Error running game: {e}")
                import traceback
                traceback.print_exc()
                # 如果出错，也要更新状态
                if session_id in running_games:
                    running_games[session_id]['status'] = 'error'
                    running_games[session_id]['error'] = str(e)

        # 启动游戏线程
        game_thread = threading.Thread(target=run_game_thread, daemon=True)
        game_thread.start()

        # 保存线程引用
        game_threads[session_id] = game_thread

        # 立即返回session_id
        return jsonify({
            'success': True,
            'session_id': session_id,
            'v_model': v_model,
            'w_model': w_model,
            'message': f'游戏启动成功，正在跳转到直播间...',
            'log_directory': log_directory,
            'status': 'initializing'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/game-status/<session_id>')
def game_status(session_id):
    """获取游戏状态"""
    try:
        if session_id not in running_games:
            return jsonify({
                'success': False,
                'error': 'Game not found'
            }), 404

        game_info = running_games[session_id]
        log_directory = game_info.get('log_directory', '')

        # 基本状态信息
        status_data = {
            'success': True,
            'session_id': session_id,
            'status': game_info['status'],
            'v_model': game_info['v_model'],
            'w_model': game_info['w_model'],
            'start_time': game_info['start_time'],
            'error': game_info.get('error', None)
        }

        # 尝试从game_complete.json获取详细的玩家和状态信息
        if log_directory and os.path.exists(log_directory):
            try:
                game_complete_file = os.path.join(log_directory, 'game_complete.json')
                if os.path.exists(game_complete_file):
                    with open(game_complete_file, 'r', encoding='utf-8') as f:
                        complete_data = json.load(f)

                        # 添加玩家信息
                        status_data['players'] = complete_data.get('players', {})
                        status_data['current_players'] = []

                        # 获取当前存活的玩家
                        current_round = complete_data.get('rounds', [])
                        if current_round:
                            latest_round = current_round[-1]
                            current_players = latest_round.get('players', [])
                            status_data['current_players'] = current_players

                        # 添加轮次信息
                        status_data['current_round'] = len(current_round)
                        status_data['winner'] = complete_data.get('winner', '')
                        status_data['rounds'] = current_round

            except Exception as e:
                print(f"Error reading game_complete.json for {session_id}: {e}")

        return jsonify(status_data)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/stop-game/<session_id>', methods=['POST'])
def stop_game(session_id):
    """终止游戏"""
    try:
        if session_id not in running_games:
            return jsonify({
                'success': False,
                'error': 'Game not found'
            }), 404

        game_info = running_games[session_id]

        # 检查游戏状态
        if game_info['status'] in ['completed', 'stopped', 'error']:
            return jsonify({
                'success': False,
                'error': f'Game already {game_info["status"]}'
            }), 400

        # 更新游戏状态为停止中
        game_info['status'] = 'stopping'

        # 优雅终止：调用GameMaster的停止方法
        if session_id in game_masters:
            gamemaster = game_masters[session_id]
            gamemaster.stop()
            print(f"Stop signal sent to game {session_id}")

        # 清理线程引用
        if session_id in game_threads:
            del game_threads[session_id]

        # 清理GameMaster引用
        if session_id in game_masters:
            del game_masters[session_id]

        # 更新最终状态
        game_info['status'] = 'stopped'
        game_info['stop_time'] = time.time()

        return jsonify({
            'success': True,
            'message': 'Game stop request sent. The game will finish the current round and stop gracefully.',
            'session_id': session_id,
            'final_status': 'stopped'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/list-games')
def list_games():
    """列出所有正在运行的游戏"""
    games = []
    for session_id, info in running_games.items():
        games.append({
            'session_id': session_id,
            'status': info['status'],
            'v_model': info['v_model'],
            'w_model': info['w_model'],
            'start_time': info['start_time'],
            'log_directory': info.get('log_directory', ''),
            'winner': info.get('winner', None)
        })

    # 按开始时间倒序排列
    games.sort(key=lambda x: x['start_time'], reverse=True)

    return jsonify({
        'success': True,
        'games': games
    })

@app.route('/latest-game')
def latest_game():
    """获取最新的游戏"""
    if not running_games:
        return jsonify({
            'success': False,
            'error': 'No games found'
        })

    # 获取最新的游戏
    latest_game = max(running_games.values(), key=lambda x: x.get('start_time', 0))

    return jsonify({
        'success': True,
        'game': latest_game
    })

@app.route('/api-status')
def api_status():
    """检查API配置状态"""
    try:
        return jsonify(api_config.get_status())
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api-config')
def api_config_page():
    """API配置页面"""
    try:
        status = api_config.get_status()

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>API配置状态</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .status {{ padding: 10px; margin: 10px 0; border-radius: 5px; }}
                .success {{ background-color: #d4edda; color: #155724; }}
                .warning {{ background-color: #fff3cd; color: #856404; }}
                .error {{ background-color: #f8d7da; color: #721c24; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .config-info {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <h1>🔑 API配置状态</h1>

            <div class="config-info">
                <h3>📁 配置文件: {status.get('config_file', 'api_config.json')}</h3>
                <p><strong>配置方式:</strong> 编辑 api_config.json 文件或使用环境变量</p>
            </div>

            <h2>🔌 API状态</h2>
            <table>
                <tr><th>API类型</th><th>状态</th><th>密钥预览</th><th>基础URL</th></tr>
        """

        for api_type, api_info in status.get('apis', {}).items():
            status_class = "success" if api_info.get('configured') else "warning"
            status_text = "✅ 已配置" if api_info.get('configured') else "⚠️ 未配置"

            html += f"""
                <tr>
                    <td>{api_type.upper()}</td>
                    <td class="{status_class}">{status_text}</td>
                    <td>{api_info.get('key_preview', '')}</td>
                    <td>{api_info.get('base_url', '')}</td>
                </tr>
            """

        html += """
            </table>

            <h2>🤖 模型状态</h2>
            <table>
                <tr><th>模型名称</th><th>状态</th><th>API类型</th><th>模型名称</th></tr>
        """

        for model_name, model_info in status.get('models', {}).items():
            status_class = "success" if model_info.get('enabled') else "error"
            status_text = "✅ 已启用" if model_info.get('enabled') else "❌ 已禁用"

            html += f"""
                <tr>
                    <td>{model_name}</td>
                    <td class="{status_class}">{status_text}</td>
                    <td>{model_info.get('api_type', '')}</td>
                    <td>{model_info.get('model_name', '')}</td>
                </tr>
            """

        html += """
            </table>

            <div class="config-info">
                <h3>🔧 配置GLM API密钥</h3>
                <p>1. 访问 <a href="https://open.bigmodel.cn/" target="_blank">智谱AI开放平台</a> 获取API密钥</p>
                <p>2. 编辑 api_config.json 文件，在 apis.glm.api_key 中填入密钥</p>
                <p>3. 或设置环境变量: export GLM_API_KEY='your-api-key'</p>

                <h3>⚠️ 注意事项</h3>
                <p>• Google Cloud API已禁用以避免认证问题</p>
                <p>• 推荐使用 glmz1-flash 模型</p>
                <p>• 配置修改后需要重启Web服务器</p>
            </div>

            <p><a href="/">← 返回首页</a></p>
        </body>
        </html>
        """

        return html
    except Exception as e:
        return f"<h1>错误</h1><p>{str(e)}</p>", 500

@app.route('/api/v1/games/<session_id>/logs')
def get_game_logs(session_id):
    """获取游戏日志"""
    try:
        if session_id not in running_games:
            return jsonify({
                'success': False,
                'error': 'Game not found'
            }), 404

        game_info = running_games[session_id]
        log_directory = game_info.get('log_directory', '')

        if not log_directory or not os.path.exists(log_directory):
            return jsonify([])  # 返回空日志数组

        # 尝试读取游戏日志文件
        logs = []
        try:
            # 查找游戏日志文件
            game_logs_file = os.path.join(log_directory, 'game_logs.json')
            if os.path.exists(game_logs_file):
                with open(game_logs_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            else:
                # 如果没有game_logs.json，尝试其他日志文件
                for filename in os.listdir(log_directory):
                    if filename.endswith('.json'):
                        try:
                            with open(os.path.join(log_directory, filename), 'r', encoding='utf-8') as f:
                                log_data = json.load(f)
                                if isinstance(log_data, list):
                                    logs = log_data
                                    break
                        except:
                            continue
        except Exception as e:
            print(f"Error reading logs for {session_id}: {e}")
            logs = []

        return jsonify(logs)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# 静态文件服务
@app.route('/<path:filename>')
def static_files(filename):
    """提供静态文件服务"""
    # 特殊处理 index_live.html -> index.html
    if filename == 'index_live.html':
        return send_from_directory('.', 'index.html')
    return send_from_directory('.', filename)

@app.route('/static/<path:filename>')
def static_files_subdir(filename):
    """提供static目录下的静态文件服务"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    print("🐺 狼人杀竞技场 Web 服务器启动中...")
    print("🌐 服务器地址: http://localhost:8081")
    print("🎮 首页地址: http://localhost:8081/")
    print("📡 API地址: http://localhost:8081/start-game")
    print("=" * 50)

    # 启动Flask服务器
    app.run(
        host='0.0.0.0',
        port=8081,
        debug=False,
        threaded=True
    )