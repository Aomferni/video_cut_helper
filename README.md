# 视频自动剪辑工具

基于Python Flask + FFmpeg的视频自动剪辑工具，支持视频剪辑、播放、信息查看和视频拼接功能。

## 功能特性

1. **视频剪辑**：
   - 上传视频文件和Excel剪辑需求文件
   - 或直接在网页表格中填写剪辑时间点
   - 支持精确时间剪辑（零重编码）

2. **视频播放与信息查看**：
   - 视频播放器
   - 视频信息查看（时长、分辨率等）
   - 时间点记录功能

3. **视频拼接**：
   - 上传多个视频文件
   - 一键拼接为完整视频

## 环境要求

- Python 3.7+
- FFmpeg
- Flask
- MoviePy
- pandas

## 安装步骤

1. 克隆项目或解压项目文件

2. 使用安装指南脚本（推荐）：
```bash
python install_guide.py
```

3. 或手动安装Python依赖：
```bash
# 方法1：直接安装（推荐）
pip install -r requirements.txt

# 方法2：如果方法1失败，逐个安装
pip install Flask==2.3.2
pip install moviepy==1.0.3
pip install openpyxl>=3.0.0
pip install pandas>=1.3.0

# 方法3：如果pandas安装失败，尝试使用conda（如果已安装Anaconda）
conda install pandas
```

4. 安装FFmpeg：
   - Windows: 下载FFmpeg并添加到系统PATH
   - macOS: `brew install ffmpeg`
   - Ubuntu/Debian: `sudo apt update && sudo apt install ffmpeg`

## 常见问题及解决方案

### 1. pandas安装失败
如果遇到"Failed to build pandas"错误，请尝试以下方法：

```bash
# 方法1：升级pip和setuptools
pip install --upgrade pip setuptools

# 方法2：安装预编译版本
pip install --only-binary=all pandas

# 方法3：指定版本安装
pip install pandas==1.3.5

# 方法4：使用conda（如果已安装Anaconda）
conda install pandas
```

### 2. FFmpeg相关问题
如果遇到FFmpeg相关错误，请确保：

1. FFmpeg已正确安装：
   ```bash
   ffmpeg -version
   ```

2. 如果系统找不到FFmpeg，可以安装imageio_ffmpeg：
   ```bash
   pip install imageio-ffmpeg
   ```

### 3. MoviePy相关问题
如果遇到MoviePy导入错误：

```bash
# 重新安装MoviePy
pip uninstall moviepy
pip install moviepy==1.0.3
```

### 4. 端口占用问题
如果遇到"Address already in use"错误：

1. macOS系统：禁用AirPlay Receiver服务
   - 系统偏好设置 -> 通用 -> AirDrop与Handoff -> 关闭AirPlay接收器

2. 或者修改应用端口：
   ```bash
   # 在app.py中修改端口号
   app.run(debug=True, host='0.0.0.0', port=5001)  # 改为5001或其他端口
   ```

## 运行项目

```bash
python app.py
```

项目将在 `http://localhost:5001` 启动（注意：已更改为5001端口以避免冲突）

## 使用说明

1. 打开浏览器访问 `http://localhost:5001`

2. 视频剪辑：
   - 上传视频文件
   - 上传Excel剪辑需求文件或在表格中直接填写
   - 点击"开始剪辑"

3. 视频播放与信息：
   - 上传视频文件
   - 使用播放器控制视频播放
   - 查看视频详细信息

4. 视频拼接：
   - 上传多个视频文件
   - 设置输出文件名
   - 点击"开始拼接"

## 项目结构

```
video_cutter_project/
├── app.py                 # Flask主应用
├── requirements.txt       # Python依赖
├── README.md             # 说明文档
├── install_guide.py      # 安装指南脚本
├── start.sh              # 启动脚本
├── templates/
│   └── index.html        # 主页面模板
├── static/
│   ├── css/
│   │   └── style.css     # 样式文件
│   ├── js/
│   │   └── script.js     # JavaScript逻辑
│   ├── uploads/          # 上传文件目录
│   └── output/           # 输出文件目录
```

## 注意事项

1. 请确保FFmpeg已正确安装并可全局访问
2. 视频处理需要一定时间，请耐心等待
3. 剪辑后的视频文件保存在 `static/output/` 目录中
4. 支持的视频格式：mp4, avi, mov, mkv等常见格式

## 技术栈

- 后端：Python Flask
- 前端：HTML, CSS, JavaScript
- 视频处理：FFmpeg, MoviePy
- 数据处理：pandas

## 许可证

MIT License