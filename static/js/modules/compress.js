// 视频压缩模块

// 全局变量
let uploadedCompressVideoPath = null;

/**
 * 初始化视频压缩标签页
 */
function initCompressTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForCompress();
    // 选择视频文件后直接播放，不需要上传
    document.getElementById('compressVideoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接播放视频，不上传到服务器
            playUploadedVideo(file);
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelect').value = '';
        }
    });
    // 从已上传文件中选择视频（视频压缩页面）
    document.getElementById('existingVideoSelect').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('compressVideoFile').value = '';
            // 设置上传路径
            uploadedCompressVideoPath = selectedValue;
            // 获取文件名
            const fileName = selectedValue.split('/').pop();
            document.getElementById('compressResult').textContent = '已选择文件: ' + fileName;
            // 播放视频
            playVideoFromPathLocal(selectedValue);
        }
    });
    // 刷新视频列表按钮（视频压缩页面）
    document.getElementById('refreshVideoListForCompressBtn').addEventListener('click', function() {
        refreshVideoListForCompress();
    });
    // 上传视频按钮
    document.getElementById('uploadCompressVideoBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('compressVideoFile');
        if (fileInput.files.length === 0) {
            alert('请先选择视频文件');
            return;
        }
        // 显示上传进度条
        const progressContainer = document.getElementById('compressVideoUploadProgressContainer');
        const progressBar = document.getElementById('compressVideoUploadProgress');
        const progressText = document.getElementById('compressVideoUploadProgressText');
        progressContainer.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';
        // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.value = progress;
            progressText.textContent = progress + '%';
        }, 100);
        // 真实的上传逻辑（在模拟进度完成后执行）
        setTimeout(() => {
            const formData = new FormData();
            formData.append('video', fileInput.files[0]);
            fetch('/upload_video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    uploadedCompressVideoPath = data.filepath;
                    document.getElementById('compressResult').textContent = '视频上传成功: ' + data.filename;
                    // 刷新视频列表
                    refreshVideoListForCompress();
                }
            })
            .catch(error => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                console.error('Error:', error);
                alert('上传失败: ' + error);
            });
        }, 3000); // 3秒后执行真实上传
    });
    // 开始压缩按钮
    document.getElementById('compressButton').addEventListener('click', function() {
        compressVideo();
    });
    // 初始化视频播放器功能
    initCompressPlayer();
    // 初始化输出文件列表
    updateCompressOutputFilesList();
}

/**
 * 刷新视频列表（视频压缩页面）
 */
function refreshVideoListForCompress() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelect');
        // 检查元素是否存在
        if (!selectElement) {
            console.error('Cannot find element with id "existingVideoSelect"');
            return;
        }
        // 保留默认选项
        const defaultOption = selectElement.options[0];
        selectElement.innerHTML = '';
        if (defaultOption) {
            selectElement.appendChild(defaultOption);
        }
        // 添加视频文件选项
        data.files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = `${file.name} (${file.size})`;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 初始化视频压缩页面的视频播放器
 */
function initCompressPlayer() {
    const videoPlayer = document.getElementById('compressVideoPlayer');
    const currentTimeDisplay = document.getElementById('compressCurrentTime');
    const durationDisplay = document.getElementById('compressDuration');
    // 获取进度条元素
    const progressContainer = document.getElementById('compressProgressContainer');
    const progressBarFill = document.getElementById('compressProgressBarFill');
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        const currentTime = videoPlayer.currentTime;
        currentTimeDisplay.textContent = secondsToHMS(currentTime);

        // 更新进度条
        if (videoPlayer.duration) {
            const progressPercent = (currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = progressPercent + '%';
        }
    });

    // 视频加载元数据后显示总时长
    videoPlayer.addEventListener('loadedmetadata', function() {
        const duration = videoPlayer.duration;
        durationDisplay.textContent = secondsToHMS(duration);
    });

    // 进度条点击跳转
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = this.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });

    // 添加鼠标悬停显示时间的功能
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = this.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;

            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('compressHoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);

            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });

    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('compressHoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });

    // 播放/暂停按钮
    document.getElementById('compressPlayPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
}

/**
 * 视频压缩功能
 */
function compressVideo() {
    const resultBox = document.getElementById('compressResult');
    const preset = document.getElementById('compressionPreset').value;
    const speedMode = document.getElementById('compressionSpeed').value;
    // 检查是否已上传视频
    if (!uploadedCompressVideoPath) {
        alert('请先上传视频文件');
        return;
    }
    resultBox.textContent = "正在处理视频压缩...";
    // 准备要发送的数据
    const requestData = {
        video_path: uploadedCompressVideoPath,
        preset: preset,
        speed_mode: speedMode
    };
    // 发送压缩请求
    fetch('/compress_video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultBox.textContent = '处理失败: ' + data.error;
        } else {
            resultBox.textContent = '视频压缩完成: ' + data.output_file;
            // 更新输出文件列表
            updateCompressOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultBox.textContent = '处理失败: ' + error;
    });
}

/**
 * 更新视频压缩输出文件列表
 */
function updateCompressOutputFilesList() {
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const listElement = document.getElementById('compressOutputFilesList');
        listElement.innerHTML = '';
        data.files.forEach(file => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${file.name} (${file.size})</span>
                <a href="/download/${file.name}" target="_blank">下载</a>
            `;
            listElement.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// 从路径播放视频（本地版本）
function playVideoFromPathLocal(videoPath, targetPlayerId) {
    // 获取文件名
    const fileName = videoPath.split('/').pop();
    // 构造视频文件的访问URL
    // 注意：这需要服务器支持文件访问
    const videoUrl = `/static/uploads/${fileName}`;
    // 确定要播放视频的播放器
    let videoPlayer;
    if (targetPlayerId) {
        videoPlayer = document.getElementById(targetPlayerId);
    } else {
        videoPlayer = document.getElementById('compressVideoPlayer');
    }

    if (videoPlayer) {
        videoPlayer.src = videoUrl;
        // 自动播放视频
        videoPlayer.play().catch(error => {
            console.log('自动播放失败:', error);
            // 如果自动播放失败，至少设置视频源
            videoPlayer.src = videoUrl;
        });
    }
}

// 播放压缩页面的视频文件
function playUploadedVideo(file) {
    const videoPlayer = document.getElementById('compressVideoPlayer');
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
}

// 导出函数供其他模块使用
export {
    initCompressTab,
    refreshVideoListForCompress,
    initCompressPlayer,
    compressVideo,
    updateCompressOutputFilesList,
    playVideoFromPathLocal,
    playUploadedVideo
};