"""
多画面裁剪拼接测试模块
用于测试新功能：从视频中裁剪多个画面区域，自由布局拼接后完成剪辑
"""

from flask import Flask, request, jsonify, send_from_directory
import os
import subprocess
import tempfile
import uuid
import shutil
from werkzeug.utils import secure_filename

# 尝试导入imageio_ffmpeg
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG_PATH = 'ffmpeg'

# 配置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'static', 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, '..', 'static', 'output')

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 * 1024  # 16GB max

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


def is_video_file(filename):
    """检查文件是否为视频文件"""
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.m4v'}
    _, ext = os.path.splitext(filename.lower())
    return ext in video_extensions


def format_file_size(size_bytes):
    """格式化文件大小"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def seconds_to_time(seconds):
    """将秒数转换为时间字符串"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


@app.route('/')
def index():
    """主页面"""
    return send_from_directory('.', 'index.html')


@app.route('/list_upload_videos')
def list_upload_videos():
    """列出上传的视频文件（包含子文件夹）"""
    try:
        files = []
        upload_dir = app.config['UPLOAD_FOLDER']
        
        if os.path.exists(upload_dir):
            for root, dirs, filenames in os.walk(upload_dir):
                for filename in filenames:
                    if is_video_file(filename):
                        filepath = os.path.join(root, filename)
                        try:
                            file_size = format_file_size(os.path.getsize(filepath))
                        except:
                            file_size = "未知"
                        
                        relative_path = os.path.relpath(root, upload_dir)
                        if relative_path == '.':
                            display_name = filename
                            folder = ''
                            web_path = f'/static/uploads/{filename}'
                        else:
                            display_name = f"{relative_path}/{filename}"
                            folder = relative_path
                            web_path = f'/static/uploads/{relative_path}/{filename}'
                        
                        files.append({
                            'name': filename,
                            'display_name': display_name,
                            'folder': folder,
                            'path': web_path.replace('//', '/'),
                            'size': file_size
                        })
            
            files.sort(key=lambda x: (x['folder'], x['name']))
        
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/static/uploads/<path:filename>')
def serve_upload(filename):
    """提供上传文件访问"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/static/output/<path:filename>')
def serve_output(filename):
    """提供输出文件访问"""
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename)


def crop_video_region(input_path, output_path, x, y, width, height, start_time, end_time):
    """裁剪视频的指定区域和时间段"""
    try:
        width = width - (width % 2)
        height = height - (height % 2)
        
        cmd = [
            FFMPEG_PATH,
            '-i', input_path,
            '-ss', str(start_time),
            '-to', str(end_time),
            '-vf', f'crop={width}:{height}:{x}:{y}',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-y',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            return False
        
        return True
    except Exception as e:
        print(f"Crop error: {str(e)}")
        return False


def crop_video_region_with_output(input_path, output_path, x, y, width, height, start_time, end_time):
    """裁剪视频的指定区域和时间段，输出指定尺寸"""
    try:
        width = width - (width % 2)
        height = height - (height % 2)
        
        cmd = [
            FFMPEG_PATH,
            '-i', input_path,
            '-ss', str(start_time),
            '-to', str(end_time),
            '-vf', f'crop={width}:{height}:{x}:{y}',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-an',
            '-y',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            print(f"FFmpeg crop error: {result.stderr}")
            return False
        
        return True
    except Exception as e:
        print(f"Crop error: {str(e)}")
        return False


@app.route('/canvas_crop_concat', methods=['POST'])
def canvas_crop_concat():
    """画布式多画面裁剪拼接接口 - 支持自由位置和层级"""
    try:
        data = request.json
        video_path = data.get('video_path')
        regions = data.get('regions', [])
        canvas_width = data.get('canvas_width', 1280)
        canvas_height = data.get('canvas_height', 720)
        bg_color = data.get('bg_color', '#1a1a2e')
        output_name = data.get('output_name', 'output.mp4')
        
        if not video_path or not regions:
            return jsonify({'error': '缺少必要参数'})
        
        if video_path.startswith('/static/'):
            video_path = video_path.replace('/static/', '').replace('uploads/', '')
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], video_path)
        else:
            input_path = video_path
        
        if not os.path.exists(input_path):
            return jsonify({'error': f'视频文件不存在: {input_path}'})
        
        temp_dir = tempfile.mkdtemp()
        sorted_regions = sorted(regions, key=lambda r: r.get('z_index', 0))
        
        cropped_files = []
        for i, region in enumerate(sorted_regions):
            source_x = region.get('source_x', 0)
            source_y = region.get('source_y', 0)
            width = region.get('width', 100)
            height = region.get('height', 100)
            start_time = region.get('start_time', 0)
            end_time = region.get('end_time', 0)
            
            cropped_path = os.path.join(temp_dir, f'crop_{i}.mp4')
            
            success = crop_video_region_with_output(
                input_path, cropped_path,
                source_x, source_y, width, height,
                start_time, end_time
            )
            
            if success:
                cropped_files.append({
                    'path': cropped_path,
                    'layout_x': region.get('layout_x', 0),
                    'layout_y': region.get('layout_y', 0),
                    'width': width,
                    'height': height,
                    'z_index': region.get('z_index', 0)
                })
        
        if not cropped_files:
            return jsonify({'error': '所有裁剪操作都失败了'})
        
        output_filename = secure_filename(output_name)
        if not output_filename.endswith('.mp4'):
            output_filename += '.mp4'
        
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        success = compose_canvas(cropped_files, output_path, canvas_width, canvas_height, bg_color)
        
        if not success:
            return jsonify({'error': '画布拼接失败'})
        
        previews = []
        preview_path = os.path.join(temp_dir, 'preview.jpg')
        cmd = [
            FFMPEG_PATH,
            '-i', output_path,
            '-ss', '00:00:01',
            '-vframes', '1',
            '-y',
            preview_path
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)
        
        if os.path.exists(preview_path):
            preview_filename = f'preview_{uuid.uuid4().hex}.jpg'
            preview_dest = os.path.join(app.config['OUTPUT_FOLDER'], preview_filename)
            shutil.copy(preview_path, preview_dest)
            previews.append({
                'url': f'/static/output/{preview_filename}',
                'title': '拼接结果预览'
            })
        
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return jsonify({
            'success': True,
            'output_url': f'/static/output/{output_filename}',
            'output_path': output_path,
            'previews': previews
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})


def compose_canvas(cropped_files, output_path, canvas_width, canvas_height, bg_color):
    """使用 overlay 滤镜将多个视频合成到画布上"""
    try:
        if not cropped_files:
            return False
        
        # 转换背景色
        color_map = {
            'transparent': 'black@0.0',
            '#000000': 'black',
            '#ffffff': 'white',
            '#f0f0f0': 'gray',
            '#1a1a2e': '0x1a1a2e'
        }
        ffmpeg_bg = color_map.get(bg_color, '0x1a1a2e')
        
        if bg_color.startswith('#') and bg_color not in color_map:
            r = int(bg_color[1:3], 16)
            g = int(bg_color[3:5], 16)
            b = int(bg_color[5:7], 16) if len(bg_color) > 6 else 0
            ffmpeg_bg = f'0x{r:02x}{g:02x}{b:02x}'
        
        inputs = []
        
        # 创建背景
        filter_chain = f'color=c={ffmpeg_bg}:s={canvas_width}x{canvas_height}:d=1[base];'
        
        # 添加第一个视频
        first_file = cropped_files[0]
        inputs.extend(['-i', first_file['path']])
        x, y = first_file['layout_x'], first_file['layout_y']
        filter_chain += f'[base][0:v]overlay={x}:{y}[v0];'
        
        # 添加其他视频
        for i in range(1, len(cropped_files)):
            file_info = cropped_files[i]
            inputs.extend(['-i', file_info['path']])
            x, y = file_info['layout_x'], file_info['layout_y']
            filter_chain += f'[v{i-1}][{i}:v]overlay={x}:{y}[v{i}];'
        
        # 最终输出
        filter_chain = filter_chain.rstrip(';').replace(f'[v{len(cropped_files)-1}]', '[out]')
        
        cmd = [
            FFMPEG_PATH,
            *inputs,
            '-filter_complex', filter_chain,
            '-map', '[out]',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-an',
            '-y',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            print(f"Canvas compose error: {result.stderr}")
            return simple_canvas_compose(cropped_files, output_path, canvas_width, canvas_height)
        
        return True
        
    except Exception as e:
        print(f"Compose error: {str(e)}")
        return False


def simple_canvas_compose(cropped_files, output_path, canvas_width, canvas_height):
    """简化的画布合成方案"""
    try:
        if len(cropped_files) == 1:
            cmd = [
                FFMPEG_PATH,
                '-i', cropped_files[0]['path'],
                '-vf', f'scale={canvas_width}:{canvas_height}:force_original_aspect_ratio=decrease,pad={canvas_width}:{canvas_height}:(ow-iw)/2:(oh-ih)/2',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-an',
                '-y',
                output_path
            ]
        else:
            inputs = []
            for file_info in cropped_files:
                inputs.extend(['-i', file_info['path']])
            
            n = len(cropped_files)
            import math
            cols = math.ceil(math.sqrt(n))
            
            layouts = []
            for i in range(n):
                row = i // cols
                col = i % cols
                layouts.append(f'{col}_{row}')
            
            layout_str = '|'.join(layouts)
            filter_input = ''.join([f'[{i}:v]' for i in range(n)])
            filter_str = f'{filter_input}xstack=inputs={n}:layout={layout_str}[v];[v]scale={canvas_width}:{canvas_height}:force_original_aspect_ratio=decrease,pad={canvas_width}:{canvas_height}:(ow-iw)/2:(oh-ih)/2[out]'
            
            cmd = [
                FFMPEG_PATH,
                *inputs,
                '-filter_complex', filter_str,
                '-map', '[out]',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-an',
                '-y',
                output_path
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            print(f"Simple compose error: {result.stderr}")
            return False
        
        return True
        
    except Exception as e:
        print(f"Simple compose error: {str(e)}")
        return False


@app.route('/multi_crop_concat', methods=['POST'])
def multi_crop_concat():
    """多画面裁剪拼接接口（保留原功能）"""
    try:
        data = request.json
        video_path = data.get('video_path')
        regions = data.get('regions', [])
        output_name = data.get('output_name', 'output.mp4')
        direction = data.get('direction', 'horizontal')
        
        if not video_path or not regions:
            return jsonify({'error': '缺少必要参数'})
        
        if video_path.startswith('/static/'):
            video_path = video_path.replace('/static/', '').replace('uploads/', '')
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], video_path)
        else:
            input_path = video_path
        
        if not os.path.exists(input_path):
            return jsonify({'error': f'视频文件不存在: {input_path}'})
        
        temp_dir = tempfile.mkdtemp()
        cropped_paths = []
        
        for i, region in enumerate(regions):
            x = region.get('x', 0)
            y = region.get('y', 0)
            width = region.get('width', 100)
            height = region.get('height', 100)
            start_time = region.get('start_time', 0)
            end_time = region.get('end_time', 0)
            
            cropped_path = os.path.join(temp_dir, f'crop_{i}.mp4')
            
            success = crop_video_region(
                input_path, cropped_path,
                x, y, width, height,
                start_time, end_time
            )
            
            if success:
                cropped_paths.append(cropped_path)
        
        if not cropped_paths:
            return jsonify({'error': '所有裁剪操作都失败了'})
        
        output_filename = secure_filename(output_name)
        if not output_filename.endswith('.mp4'):
            output_filename += '.mp4'
        
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        # 使用 concatenate_videos_grid 函数
        success = concatenate_videos_grid(cropped_paths, output_path, direction)
        
        if not success:
            return jsonify({'error': '视频拼接失败'})
        
        previews = []
        for i, path in enumerate(cropped_paths):
            preview_path = os.path.join(temp_dir, f'preview_{i}.jpg')
            cmd = [
                FFMPEG_PATH,
                '-i', path,
                '-ss', '00:00:01',
                '-vframes', '1',
                '-y',
                preview_path
            ]
            subprocess.run(cmd, capture_output=True, timeout=30)
            
            if os.path.exists(preview_path):
                preview_filename = f'preview_{uuid.uuid4().hex}_{i}.jpg'
                preview_dest = os.path.join(app.config['OUTPUT_FOLDER'], preview_filename)
                shutil.copy(preview_path, preview_dest)
                previews.append({
                    'url': f'/static/output/{preview_filename}',
                    'title': f'裁剪区域 {i + 1}'
                })
        
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return jsonify({
            'success': True,
            'output_url': f'/static/output/{output_filename}',
            'output_path': output_path,
            'previews': previews
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})


def concatenate_videos_grid(video_paths, output_path, direction='horizontal'):
    """拼接多个视频（支持横向、纵向、网格布局）"""
    try:
        if not video_paths:
            return False
        
        if len(video_paths) == 1:
            shutil.copy(video_paths[0], output_path)
            return True
        
        # 获取所有视频的尺寸信息
        video_info = []
        for path in video_paths:
            cmd = [
                FFMPEG_PATH,
                '-i', path,
                '-f', 'null',
                '-'
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            width, height = 1920, 1080
            for line in result.stderr.split('\n'):
                if 'Stream' in line and 'Video:' in line:
                    import re
                    match = re.search(r'(\d+)x(\d+)', line)
                    if match:
                        width = int(match.group(1))
                        height = int(match.group(2))
                        break
            
            video_info.append({'path': path, 'width': width, 'height': height})
        
        if direction == 'horizontal':
            n = len(video_paths)
            v_stack = ''.join([f'[{i}:v]' for i in range(n)])
            filter_str = f'{v_stack}hstack=inputs={n}[v]'
            
            inputs = []
            for path in video_paths:
                inputs.extend(['-i', path])
            
            cmd = [
                FFMPEG_PATH,
                *inputs,
                '-filter_complex', filter_str,
                '-map', '[v]',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-an',
                '-y',
                output_path
            ]
            
        elif direction == 'vertical':
            n = len(video_paths)
            v_stack = ''.join([f'[{i}:v]' for i in range(n)])
            filter_str = f'{v_stack}vstack=inputs={n}[v]'
            
            inputs = []
            for path in video_paths:
                inputs.extend(['-i', path])
            
            cmd = [
                FFMPEG_PATH,
                *inputs,
                '-filter_complex', filter_str,
                '-map', '[v]',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-an',
                '-y',
                output_path
            ]
            
        else:  # grid
            import math
            n = len(video_paths)
            cols = math.ceil(math.sqrt(n))
            
            inputs = []
            for path in video_paths:
                inputs.extend(['-i', path])
            
            layouts = []
            for i in range(n):
                row = i // cols
                col = i % cols
                layouts.append(f'{col}_{row}')
            
            layout_str = '|'.join(layouts)
            v_stack = ''.join([f'[{i}:v]' for i in range(n)])
            filter_str = f'{v_stack}xstack=inputs={n}:layout={layout_str}[v]'
            
            cmd = [
                FFMPEG_PATH,
                *inputs,
                '-filter_complex', filter_str,
                '-map', '[v]',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-an',
                '-y',
                output_path
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            print(f"Concatenate error: {result.stderr}")
            return False
        
        return True
        
    except Exception as e:
        print(f"Concatenate error: {str(e)}")
        return False


if __name__ == '__main__':
    print(f"多画面裁剪拼接测试服务器启动...")
    print(f"上传文件夹: {UPLOAD_FOLDER}")
    print(f"输出文件夹: {OUTPUT_FOLDER}")
    app.run(host='0.0.0.0', port=5002, debug=True)
