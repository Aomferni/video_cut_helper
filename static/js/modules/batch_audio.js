// 视频批量转音频模块

// 初始化视频批量转音频功能
function initBatchAudioTab() {
    // 绑定事件监听器
    const convertBtn = document.getElementById('batchConvertAudioBtn');
    const refreshBtn = document.getElementById('refreshBatchAudioListBtn');
    const selectAllBtn = document.getElementById('selectAllBatchAudioBtn');
    const deselectAllBtn = document.getElementById('deselectAllBatchAudioBtn');
    
    if (convertBtn) {
        convertBtn.addEventListener('click', batchConvertToAudio);
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshBatchAudioList);
    }
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllBatchAudio);
    }
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAllBatchAudio);
    }
    
    // 页面加载时刷新视频列表
    refreshBatchAudioList();
}

// 刷新视频列表
function refreshBatchAudioList() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('batchAudioVideoSelect');
        if (!select) return;
        
        select.innerHTML = '';
        
        if (data.files && data.files.length > 0) {
            // 按文件夹分组
            const filesByFolder = {};
            data.files.forEach(file => {
                const folder = file.folder || '根目录';
                if (!filesByFolder[folder]) {
                    filesByFolder[folder] = [];
                }
                filesByFolder[folder].push(file);
            });
            
            // 创建optgroup分组
            Object.keys(filesByFolder).sort().forEach(folder => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = folder;
                
                filesByFolder[folder].forEach(file => {
                    const option = document.createElement('option');
                    option.value = file.path;
                    option.textContent = `${file.name} (${file.size})`;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '暂无上传的视频文件';
            select.appendChild(option);
        }
    })
    .catch(error => {
        console.error('获取视频列表失败:', error);
        const select = document.getElementById('batchAudioVideoSelect');
        if (select) {
            select.innerHTML = '<option value="">获取视频列表时出错</option>';
        }
    });
}

// 全选视频
function selectAllBatchAudio() {
    const select = document.getElementById('batchAudioVideoSelect');
    if (!select) return;
    
    for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = true;
    }
}

// 取消全选视频
function deselectAllBatchAudio() {
    const select = document.getElementById('batchAudioVideoSelect');
    if (!select) return;
    
    for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = false;
    }
}

// 批量转换为音频
function batchConvertToAudio() {
    const select = document.getElementById('batchAudioVideoSelect');
    const resultDiv = document.getElementById('batchAudioResult');
    
    if (!select) {
        alert('页面元素加载失败，请刷新页面重试');
        return;
    }
    
    // 获取选中的视频路径
    const selectedOptions = Array.from(select.selectedOptions);
    console.log('Selected options:', selectedOptions);
    
    const selectedPaths = selectedOptions
        .map(option => option.value)
        .filter(value => value && value !== '');
    
    console.log('Selected paths:', selectedPaths);
    
    if (selectedPaths.length === 0) {
        alert('请选择要转换的视频文件');
        return;
    }
    
    // 获取音频格式
    const audioFormat = document.getElementById('audioFormat')?.value || 'mp3';
    
    // 显示处理中提示
    if (resultDiv) {
        resultDiv.innerHTML = `<p>正在转换 ${selectedPaths.length} 个视频文件...</p><progress value="0" max="${selectedPaths.length}" style="width: 100%;"></progress>`;
    }
    
    // 逐个转换视频
    const results = [];
    let completedCount = 0;
    
    const processNext = (index) => {
        if (index >= selectedPaths.length) {
            // 全部完成，显示结果
            showBatchAudioResults(results);
            return;
        }
        
        const videoPath = selectedPaths[index];
        
        fetch('/convert_to_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_path: videoPath,
                audio_format: audioFormat
            })
        })
        .then(response => response.json())
        .then(data => {
            completedCount++;
            
            if (data.success) {
                // 处理多片段情况
                if (data.is_split && data.audio_files) {
                    results.push({
                        success: true,
                        videoName: videoPath.split('/').pop(),
                        isSplit: true,
                        audioFiles: data.audio_files,
                        message: data.message,
                        totalSizeMb: data.total_size_mb
                    });
                } else {
                    // 单文件情况
                    results.push({
                        success: true,
                        videoName: videoPath.split('/').pop(),
                        isSplit: false,
                        audioPath: data.audio_path,
                        audioName: data.audio_name,
                        message: data.message
                    });
                }
            } else {
                results.push({
                    success: false,
                    videoName: videoPath.split('/').pop(),
                    error: data.error || '转换失败'
                });
            }
            
            // 更新进度
            if (resultDiv) {
                resultDiv.innerHTML = `<p>正在转换... (${completedCount}/${selectedPaths.length})</p><progress value="${completedCount}" max="${selectedPaths.length}" style="width: 100%;"></progress>`;
            }
            
            // 处理下一个
            processNext(index + 1);
        })
        .catch(error => {
            completedCount++;
            results.push({
                success: false,
                videoName: videoPath.split('/').pop(),
                error: error.message
            });
            
            // 更新进度
            if (resultDiv) {
                resultDiv.innerHTML = `<p>正在转换... (${completedCount}/${selectedPaths.length})</p><progress value="${completedCount}" max="${selectedPaths.length}" style="width: 100%;"></progress>`;
            }
            
            // 处理下一个
            processNext(index + 1);
        });
    };
    
    // 开始处理
    processNext(0);
}

// 显示批量转换结果
function showBatchAudioResults(results) {
    const resultDiv = document.getElementById('batchAudioResult');
    if (!resultDiv) return;
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    let html = `<h4>转换完成</h4>`;
    html += `<p>成功: ${successCount} 个, 失败: ${failCount} 个</p>`;
    html += '<ul style="max-height: 300px; overflow-y: auto;">';
    
    results.forEach(result => {
        if (result.success) {
            if (result.isSplit) {
                // 多片段情况
                html += `<li style="margin: 5px 0;">✅ ${result.videoName} → 已切分为 ${result.audioFiles.length} 个音频文件`;
                html += `<ul style="margin-left: 20px; font-size: 0.9em; color: #666;">`;
                result.audioFiles.forEach(file => {
                    const startTime = formatDuration(file.start_time);
                    const duration = formatDuration(file.duration);
                    html += `<li>${file.name} (${file.size_mb}MB) [${startTime} - ${duration}]</li>`;
                });
                html += `</ul></li>`;
            } else {
                // 单文件情况
                html += `<li style="margin: 5px 0;">✅ ${result.videoName} → ${result.audioName}</li>`;
            }
        } else {
            html += `<li style="margin: 5px 0; color: #ff4757;">❌ ${result.videoName}: ${result.error}</li>`;
        }
    });
    
    html += '</ul>';
    
    if (successCount > 0) {
        html += `<p style="margin-top: 10px;"><a href="/manage" target="_blank" style="color: #667eea;">查看输出文件 →</a></p>`;
    }
    
    resultDiv.innerHTML = html;
    
    // 刷新输出文件列表
    updateBatchAudioOutputList();
}

// 格式化时长（秒转 HH:MM:SS）
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// 更新输出文件列表
function updateBatchAudioOutputList() {
    const outputList = document.getElementById('batchAudioOutputList');
    if (!outputList) return;
    
    fetch('/list_all_files')
    .then(response => response.json())
    .then(data => {
        outputList.innerHTML = '';
        
        if (data.outputs && data.outputs.length > 0) {
            // 只显示音频文件
            const audioExts = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'];
            const audioFiles = data.outputs.filter(file => {
                const ext = file.name.split('.').pop().toLowerCase();
                return audioExts.includes(ext);
            });
            
            if (audioFiles.length > 0) {
                audioFiles.forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <strong>${file.name}</strong> (${file.size}) 
                        <a href="/download/${file.name}" target="_blank">下载</a>
                    `;
                    outputList.appendChild(listItem);
                });
            } else {
                outputList.innerHTML = '<li>暂无音频输出文件</li>';
            }
        } else {
            outputList.innerHTML = '<li>暂无输出文件</li>';
        }
    })
    .catch(error => {
        console.error('获取输出文件列表失败:', error);
        outputList.innerHTML = '<li>获取文件列表时出错</li>';
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBatchAudioTab);
} else {
    // DOM已经加载完成
    initBatchAudioTab();
}

// 导出初始化函数
export { initBatchAudioTab, refreshBatchAudioList };
