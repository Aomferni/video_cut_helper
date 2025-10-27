from flask import Flask, render_template, request, jsonify, send_file
import os
import pandas as pd
from moviepy.editor import VideoFileClip, concatenate_videoclips
import tempfile
import subprocess
import json
import uuid
from io import BytesIO

# 尝试导入imageio_ffmpeg以备FFmpeg路径问题
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG_PATH = 'ffmpeg'

app = Flask(__name__)

# 配置文件路径
UPLOAD_FOLDER = 'static/uploads'
OUTPUT_FOLDER = 'static/output'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def time_to_seconds(t):
    """将时间字符串转换为秒数"""
    # 处理空值或NaN
    if pd.isna(t) or t is None or str(t).strip() == "":
        return 0.0
    try:
        h, m, s = map(float, str(t).split(":"))
        return h * 3600 + m * 60 + s
    except ValueError:
        return 0.0

def seconds_to_time(seconds):
    """将秒数转换为时间字符串"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def get_video_info(video_path):
    """获取视频信息"""
    try:
        with VideoFileClip(video_path) as video:
            duration = float(video.duration) if video.duration is not None else 0.0
            fps = float(video.fps) if video.fps is not None else 0.0
            size = video.size if video.size is not None else (0, 0)
            return {
                "duration": duration,
                "duration_str": seconds_to_time(duration),
                "fps": fps,
                "width": size[0],
                "height": size[1]
            }
    except Exception as e:
        return {"error": str(e)}

def smart_cut(in_file, out_file, start, end):
    """零重编码精准切片"""
    try:
        # 使用FFmpeg进行零重编码切片
        cmd = [
            FFMPEG_PATH,
            '-i', in_file,
            '-ss', str(start),
            '-to', str(end),
            '-c', 'copy',
            '-y',
            out_file
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)  # 5分钟超时
        if result.returncode != 0:
            raise Exception(f"FFmpeg error: {result.stderr}")
        return True
    except Exception as e:
        print(f"FFmpeg cut failed: {str(e)}")
        return False

def concatenate_videos(video_paths, output_path):
    """拼接多个视频文件（零重编码版）"""
    try:
        # 检查所有文件是否存在
        for fp in video_paths:
            if not os.path.exists(fp):
                return f"❌ 视频文件不存在: {fp}"
        
        # 1. 生成 concat 清单
        list_path = os.path.join(tempfile.gettempdir(), f"concat_list_{uuid.uuid4().hex}.txt")
        with open(list_path, "w", encoding="utf-8") as f:
            for fp in video_paths:
                # 处理包含特殊字符的路径
                # 使用绝对路径并规范化路径
                abs_path = os.path.abspath(fp)
                # 对于包含特殊字符的路径，使用file指令的另一种格式
                f.write(f"file '{abs_path}'\n")

        # 2. 零重编码拼接
        cmd = [
            FFMPEG_PATH,
            '-f', 'concat',
            '-safe', '0',
            '-i', list_path,
            '-c', 'copy',
            '-y',
            output_path
        ]
        
        # 打印命令用于调试
        print(f"执行FFmpeg命令: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)  # 10分钟超时
        
        # 3. 清理
        if os.path.exists(list_path):
            os.remove(list_path)
            
        if result.returncode != 0:
            error_msg = f"FFmpeg错误: {result.stderr}"
            print(error_msg)
            # 如果失败，尝试使用回退方案
            return fallback_concatenate_videos(video_paths, output_path)
            
        return f"✅ 视频拼接完成：{output_path}"

    except subprocess.TimeoutExpired:
        return "❌ 视频拼接超时，请检查视频文件大小"
    except Exception as e:
        return f"❌ 视频拼接失败: {str(e)}"

def fallback_concatenate_videos(video_paths, output_path):
    """回退方案：使用MoviePy进行拼接"""
    try:
        clips = []
        for fp in video_paths:
            if os.path.exists(fp):
                clip = VideoFileClip(fp)
                clips.append(clip)
            else:
                return f"❌ 视频文件不存在: {fp}"
        
        if clips:
            # 拼接所有剪辑
            final_clip = concatenate_videoclips(clips)
            
            # 保存结果
            final_clip.write_videofile(
                output_path,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile="temp-audio.m4a",
                remove_temp=True,
                verbose=False,
                logger=None,
                ffmpeg_params=[
                    "-crf", "23",
                    "-movflags", "+faststart",
                    "-avoid_negative_ts", "make_zero",
                    "-fflags", "+genpts",
                    "-async", "1",
                    "-vsync", "1"
                ]
            )
            
            # 关闭所有剪辑
            for clip in clips:
                clip.close()
            final_clip.close()
            
            return f"✅ 视频拼接完成（MoviePy方案）：{output_path}"
        else:
            return "❌ 没有有效的视频文件可以拼接"
            
    except Exception as e:
        return f"❌ 回退方案也失败了: {str(e)}"

def compress_video(input_path, output_path, preset='medium', speed_mode='medium'):
    """压缩视频到指定预设"""
    try:
        if not os.path.exists(input_path):
            return f"❌ 错误：找不到视频文件 {input_path}"
            
        # 获取原始视频信息
        original_info = get_video_info(input_path)
        if "error" in original_info:
            return f"❌ 获取视频信息失败: {original_info['error']}"
            
        original_size = os.path.getsize(input_path) / (1024 * 1024)  # MB
        
        # 根据预设设置CRF值和音频码率
        preset_settings = {
            'low': {'crf': 35, 'audio_bitrate': '64k'},
            'medium': {'crf': 28, 'audio_bitrate': '96k'},
            'high': {'crf': 23, 'audio_bitrate': '128k'}
        }
        
        settings = preset_settings.get(preset, preset_settings['medium'])
        crf = settings['crf']
        audio_bitrate = settings['audio_bitrate']
        
        # 根据速度模式设置preset参数
        preset_map = {
            'fast': 'ultrafast',
            'medium': 'medium',
            'slow': 'veryslow'
        }
        ffmpeg_preset = preset_map.get(speed_mode, 'medium')
        
        # 使用FFmpeg压缩视频
        cmd = [
            FFMPEG_PATH,
            '-i', input_path,
            '-vcodec', 'libx264',
            '-crf', str(crf),
            '-preset', ffmpeg_preset,
            '-acodec', 'aac',
            '-b:a', audio_bitrate,
            '-y',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)  # 10分钟超时
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg压缩错误: {result.stderr}")
            
        # 获取压缩后的文件大小
        compressed_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
        
        # 计算压缩比例
        compression_ratio = (1 - compressed_size / original_size) * 100
        
        return f"✅ 视频压缩完成！原始大小: {original_size:.1f}MB -> 压缩后大小: {compressed_size:.1f}MB (压缩比例: {compression_ratio:.1f}%)"
        
    except subprocess.TimeoutExpired:
        return "❌ 视频压缩超时，请检查视频文件大小"
    except Exception as e:
        return f"❌ 视频压缩失败: {str(e)}"

def get_compression_estimate(original_size_mb, preset='medium'):
    """根据预设估算压缩后的文件大小和预估时间"""
    # 根据预设定义压缩比例
    compression_ratios = {
        'low': 0.1,    # 压缩到原始大小的10%
        'medium': 0.25, # 压缩到原始大小的25%
        'high': 0.5    # 压缩到原始大小的50%
    }
    
    # 根据预设定义压缩速度（MB/分钟）
    compression_speeds = {
        'low': 150,    # 低质量压缩速度
        'medium': 100, # 中等质量压缩速度
        'high': 60     # 高质量压缩速度
    }
    
    ratio = compression_ratios.get(preset, compression_ratios['medium'])
    speed = compression_speeds.get(preset, compression_speeds['medium'])
    
    estimated_size = original_size_mb * ratio
    
    # 预估时间（分钟）= 原始文件大小 / 压缩速度
    estimated_time_minutes = original_size_mb / speed
    
    return {
        'original_size': original_size_mb,
        'estimated_size': estimated_size,
        'compression_ratio': (1 - ratio) * 100,
        'estimated_time_minutes': estimated_time_minutes
    }

def cut_videos_from_dataframe(input_video_path, df):
    """根据DataFrame中的时间信息裁剪视频"""
    try:
        if not os.path.exists(input_video_path):
            return f"❌ 错误：找不到视频文件 {input_video_path}"
            
        output_dir = app.config['OUTPUT_FOLDER']
        os.makedirs(output_dir, exist_ok=True)
        
        result_messages = []
        
        # 遍历每一行裁剪
        for _, row in df.iterrows():
            # 检查结束时间是否为空
            end_time = row.get("结束时间", row.get("EndTime", ""))
            # 检查是否为空值或空字符串
            if pd.isna(end_time) or (not end_time) or (str(end_time).strip() == ""):
                message = f"跳过：结束时间为空的行"
                result_messages.append(message)
                print(message)
                continue
                
            start_time = row.get("开始时间", row.get("StartTime", "00:00:00"))
            title = str(row.get("剪辑标题", row.get("Title", "untitled"))).strip().replace("/", "-").replace("\\", "-")
            
            start = time_to_seconds(start_time)
            end = time_to_seconds(end_time)
            output_path = os.path.join(output_dir, f"{title}.mp4")

            if os.path.exists(output_path):
                message = f"已存在，跳过：{output_path}"
                result_messages.append(message)
                print(message)
                continue

            message = f"正在裁剪：{title} ({start}s - {end}s)"
            result_messages.append(message)
            print(message)
            
            try:
                # 使用FFmpeg零重编码精准切片，保证音画同步
                if smart_cut(input_video_path, output_path, start, end):
                    message = f"✅ 成功裁剪：{title} ({start}s - {end}s)"
                else:
                    # 如果FFmpeg方法失败，回退到MoviePy方法
                    message = f"⚠️ FFmpeg方法失败，使用MoviePy方法"
                    with VideoFileClip(input_video_path) as video:
                        # 直接使用subclip方法
                        clip = video.subclip(start, end)
                        
                        # 优化编码参数，确保音画同步
                        clip.write_videofile(
                            output_path,
                            verbose=False,  # 减少输出信息
                            logger=None,    # 禁用logger
                            codec="libx264",
                            audio_codec="aac",
                            temp_audiofile="temp-audio.m4a",
                            remove_temp=True,
                            fps=video.fps,
                            preset="medium",
                            threads=4,
                            ffmpeg_params=[
                                "-crf", "23",  # 稍高的CRF值，平衡质量和文件大小
                                "-movflags", "+faststart",  # 网络优化
                                "-avoid_negative_ts", "make_zero",  # 确保时间戳正确
                                "-fflags", "+genpts",  # 重新生成PTS
                                "-async", "1",  # 音频同步
                                "-vsync", "1"   # 视频同步
                            ]
                        )
                        
                        # 重要：显式关闭剪辑释放资源
                        clip.close()
                    message = f"✅ 成功裁剪（MoviePy）：{title} ({start}s - {end}s)"
                result_messages.append(message)
                print(message)
            except Exception as e:
                message = f"❌ 裁剪失败：{title} - {str(e)}"
                result_messages.append(message)
                print(message)
        
        success_message = "✅ 所有片段裁剪完成！"
        result_messages.append(success_message)
        return "\n".join(result_messages)
    
    except Exception as e:
        error_message = f"❌ 处理过程中出现错误: {str(e)}"
        return error_message


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/manage')
def manage():
    return render_template('manage.html')

@app.route('/upload_video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': '没有视频文件'})
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'})
    
    if file:
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'success': '文件上传成功', 'filepath': filepath, 'filename': filename})

@app.route('/upload_excel', methods=['POST'])
def upload_excel():
    if 'excel' not in request.files:
        return jsonify({'error': '没有Excel文件'})
    
    file = request.files['excel']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'})
    
    if file:
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 读取Excel文件内容
        try:
            df = pd.read_excel(filepath)
            # 处理各种数据类型，确保可以JSON序列化
            for col in df.columns:
                if df[col].dtype == 'datetime64[ns]':
                    # 时间类型转换为字符串格式 HH:MM:SS
                    df[col] = df[col].dt.strftime('%H:%M:%S')
                elif df[col].dtype == 'timedelta64[ns]':
                    # 时间差类型转换为字符串
                    df[col] = df[col].astype(str)
                else:
                    # 其他类型转换为字符串
                    df[col] = df[col].apply(lambda x: str(x) if pd.notna(x) else '')
            
            # 转换为JSON格式
            data = df.to_dict('records')
            columns = df.columns.tolist()
            return jsonify({
                'success': 'Excel文件上传成功', 
                'filepath': filepath, 
                'filename': filename,
                'data': data,
                'columns': columns
            })
        except Exception as e:
            return jsonify({'error': f'读取Excel文件失败: {str(e)}'})

@app.route('/get_video_info', methods=['POST'])
def get_video_info_route():
    data = request.get_json()
    video_path = data.get('video_path')
    
    if not video_path or not os.path.exists(video_path):
        return jsonify({'error': '视频文件不存在'})
    
    info = get_video_info(video_path)
    return jsonify(info)

@app.route('/get_file_size', methods=['POST'])
def get_file_size_route():
    data = request.get_json()
    file_path = data.get('file_path')
    
    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': '文件不存在'})
    
    try:
        size = os.path.getsize(file_path)
        return jsonify({'size': size})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/cut_videos', methods=['POST'])
def cut_videos_route():
    data = request.get_json()
    video_path = data.get('video_path')
    excel_data = data.get('excel_data')
    
    if not video_path or not os.path.exists(video_path):
        return jsonify({'error': '视频文件不存在'})
    
    if not excel_data:
        return jsonify({'error': '没有剪辑数据'})
    
    # 将数据转换为DataFrame
    df = pd.DataFrame(excel_data)
    
    # 执行剪辑
    result = cut_videos_from_dataframe(video_path, df)
    
    return jsonify({'result': result})

@app.route('/concat_videos', methods=['POST'])
def concat_videos_route():
    data = request.get_json()
    video_paths = data.get('video_paths', [])
    output_name = data.get('output_name', '拼接结果.mp4')
    
    if not video_paths:
        return jsonify({'error': '没有选择视频文件'})
    
    # 检查所有文件是否存在
    for path in video_paths:
        if not os.path.exists(path):
            return jsonify({'error': f'视频文件不存在: {path}'})
    
    # 输出文件路径
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_name)
    
    # 拼接视频
    result = concatenate_videos(video_paths, output_path)
    
    return jsonify({'result': result, 'output_path': output_path if '✅' in result else None})

@app.route('/list_all_files')
def list_all_files():
    """列出所有上传和输出文件"""
    upload_dir = app.config['UPLOAD_FOLDER']
    output_dir = app.config['OUTPUT_FOLDER']
    
    files = {
        'uploads': [],
        'outputs': []
    }
    
    # 获取上传文件
    if os.path.exists(upload_dir):
        for filename in os.listdir(upload_dir):
            filepath = os.path.join(upload_dir, filename)
            if os.path.isfile(filepath):
                file_size = os.path.getsize(filepath)
                # 转换为MB
                file_size_mb = round(file_size / (1024 * 1024), 2)
                files['uploads'].append({
                    'name': filename,
                    'path': filepath,
                    'size': f"{file_size_mb} MB",
                    'type': 'upload'
                })
    
    # 获取输出文件
    if os.path.exists(output_dir):
        for filename in os.listdir(output_dir):
            filepath = os.path.join(output_dir, filename)
            if os.path.isfile(filepath):
                file_size = os.path.getsize(filepath)
                # 转换为MB
                file_size_mb = round(file_size / (1024 * 1024), 2)
                files['outputs'].append({
                    'name': filename,
                    'path': filepath,
                    'size': f"{file_size_mb} MB",
                    'type': 'output'
                })
    
    return jsonify(files)

@app.route('/delete_file', methods=['POST'])
def delete_file():
    """删除指定文件"""
    data = request.get_json()
    filepath = data.get('filepath')
    file_type = data.get('type')  # 'upload' 或 'output'
    
    if not filepath:
        return jsonify({'success': False, 'error': '文件路径不能为空'})
    
    # 确保文件路径在允许的目录内
    upload_dir = os.path.abspath(app.config['UPLOAD_FOLDER'])
    output_dir = os.path.abspath(app.config['OUTPUT_FOLDER'])
    file_path = os.path.abspath(filepath)
    
    if file_type == 'upload':
        if not file_path.startswith(upload_dir):
            return jsonify({'success': False, 'error': '不允许删除此目录下的文件'})
    elif file_type == 'output':
        if not file_path.startswith(output_dir):
            return jsonify({'success': False, 'error': '不允许删除此目录下的文件'})
    else:
        return jsonify({'success': False, 'error': '无效的文件类型'})
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': '文件删除成功'})
        else:
            return jsonify({'success': False, 'error': '文件不存在'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'删除文件时出错: {str(e)}'})

@app.route('/list_output_files')
def list_output_files():
    output_dir = app.config['OUTPUT_FOLDER']
    if not os.path.exists(output_dir):
        return jsonify({'files': []})
    
    files = []
    for filename in os.listdir(output_dir):
        if filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
            filepath = os.path.join(output_dir, filename)
            file_size = os.path.getsize(filepath)
            # 转换为MB
            file_size_mb = round(file_size / (1024 * 1024), 2)
            files.append({
                'name': filename,
                'path': filepath,
                'size': f"{file_size_mb} MB"
            })
    
    return jsonify({'files': files})

@app.route('/list_upload_videos')
def list_upload_videos():
    """列出所有上传的视频文件"""
    upload_dir = app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_dir):
        return jsonify({'files': []})
    
    files = []
    # 支持的视频文件扩展名
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.m4v'}
    
    for filename in os.listdir(upload_dir):
        # 检查文件扩展名是否为视频格式
        _, ext = os.path.splitext(filename.lower())
        if ext in video_extensions:
            filepath = os.path.join(upload_dir, filename)
            file_size = os.path.getsize(filepath)
            # 转换为MB
            file_size_mb = round(file_size / (1024 * 1024), 2)
            files.append({
                'name': filename,
                'path': filepath,
                'size': f"{file_size_mb} MB"
            })
    
    return jsonify({'files': files})

@app.route('/download/<filename>')
def download_file(filename):
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    else:
        return "文件不存在", 404

@app.route('/export_excel', methods=['POST'])
def export_excel():
    try:
        # 获取JSON数据
        data = request.get_json()
        table_data = data.get('table_data', [])
        
        # 创建DataFrame
        if table_data:
            # 移除表头行（如果存在）
            if table_data[0][0] == '开始时间':
                table_data = table_data[1:]
            
            df = pd.DataFrame(table_data, columns=pd.Index(['开始时间', '结束时间', '剪辑标题', '时长(分钟)']))
        else:
            # 如果没有数据，创建空的DataFrame
            df = pd.DataFrame(columns=pd.Index(['开始时间', '结束时间', '剪辑标题', '时长(分钟)']))
        
        # 保存为Excel文件
        output_dir = app.config['OUTPUT_FOLDER']
        os.makedirs(output_dir, exist_ok=True)
        filename = f"剪辑需求_{uuid.uuid4().hex[:8]}.xlsx"
        filepath = os.path.join(output_dir, filename)
        
        # 保存为Excel
        df.to_excel(filepath, index=False)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/compress_video', methods=['POST'])
def compress_video_route():
    """视频压缩路由"""
    try:
        data = request.get_json()
        video_path = data.get('video_path')
        preset = data.get('preset', 'medium')  # 默认中等质量
        speed_mode = data.get('speed_mode', 'medium')  # 默认中等速度
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({'error': '视频文件不存在'})
            
        # 生成输出文件路径，确保为MP4格式
        filename = os.path.basename(video_path)
        name, ext = os.path.splitext(filename)
        output_filename = f"{name}_compressed.mp4"  # 强制使用MP4扩展名
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        # 执行压缩
        result = compress_video(video_path, output_path, preset, speed_mode)
        
        return jsonify({
            'result': result,
            'output_path': output_path if '✅' in result else None,
            'output_filename': output_filename if '✅' in result else None
        })
    except Exception as e:
        return jsonify({'error': f'处理过程中出现错误: {str(e)}'})

@app.route('/get_compression_estimate', methods=['POST'])
def get_compression_estimate_route():
    """获取压缩估算路由"""
    try:
        data = request.get_json()
        video_path = data.get('video_path')
        preset = data.get('preset', 'medium')
        
        if not video_path or not os.path.exists(video_path):
            return jsonify({'error': '视频文件不存在'})
            
        # 获取原始视频大小
        original_size = os.path.getsize(video_path) / (1024 * 1024)  # MB
        
        # 获取压缩估算
        estimate = get_compression_estimate(original_size, preset)
        
        return jsonify(estimate)
    except Exception as e:
        return jsonify({'error': f'处理过程中出现错误: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)