import os
import requests
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='static')

# 从环境变量读取API KEY
API_KEY = os.environ.get('MS_KEY', '')
API_URL = "https://api-inference.modelscope.cn/v1/chat/completions"


@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('static', 'index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """Proxy API requests to ModelScope AI service"""
    if not API_KEY:
        return jsonify({'error': 'API KEY not configured'}), 500
    
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Call ModelScope API
        response = requests.post(
            API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json={
                "model": "Qwen/Qwen3-VL-30B-A3B-Instruct",
                "messages": [{
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}]
                }],
                "max_tokens": 4096,
                "temperature": 0.7,
                "enable_thinking": False
            },
            timeout=120
        )
        
        if response.status_code != 200:
            return jsonify({'error': f'AI API error: {response.status_code}'}), response.status_code
        
        result = response.json()
        content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        return jsonify({'content': content})
    
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860, debug=False)
