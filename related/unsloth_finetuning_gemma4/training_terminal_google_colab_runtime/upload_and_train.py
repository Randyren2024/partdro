import subprocess
import sys
import os
import time

hostname = 'never-timer-yeast-athletics.trycloudflare.com'
username = 'root'
cloudflared_path = r'C:\Users\81102\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe'
project_root = r'C:\Users\81102\Desktop\unsloth_studio_runpod_gemma4_finetuning'

proxy_cmd = f'"{cloudflared_path}" access ssh --hostname %h'

def upload_file(local_path, remote_path):
    scp_cmd = [
        'scp',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=NUL',
        '-o', 'BatchMode=yes',
        '-o', 'PreferredAuthentications=publickey',
        '-o', f'ProxyCommand={proxy_cmd}',
        local_path,
        f'{username}@{hostname}:{remote_path}'
    ]
    print(f'上传 {os.path.basename(local_path)} ...')
    proc = subprocess.Popen(scp_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in proc.stdout:
        print(f'  {line.strip()}')
    proc.wait()
    if proc.returncode == 0:
        print(f'  ✅ 成功')
    else:
        print(f'  ❌ 失败 ({proc.returncode})')
    return proc.returncode == 0

def run_ssh(command):
    ssh_cmd = [
        'ssh',
        '-tt',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=NUL',
        '-o', 'BatchMode=yes',
        '-o', 'PreferredAuthentications=publickey',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ServerAliveCountMax=3',
        '-o', f'ProxyCommand={proxy_cmd}',
        f'{username}@{hostname}',
        command
    ]
    proc = subprocess.Popen(
        ssh_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    for line in proc.stdout:
        print(line, end='')
        sys.stdout.flush()
    proc.wait()
    return proc.returncode

# 1. 上传数据集
print('='*60)
print('1. 上传数据集...')
print('='*60)
dataset_local = os.path.join(project_root, 'gemma_finetune_dataset.jsonl')
upload_file(dataset_local, '/content/gemma_finetune_dataset.jsonl')

# 2. 上传训练脚本
print()
print('='*60)
print('2. 上传训练脚本...')
print('='*60)
script_local = os.path.join(project_root, 'scripts', 'colab_terminal_train.py')
upload_file(script_local, '/content/colab_terminal_train.py')

# 3. 验证文件
print()
print('='*60)
print('3. 验证文件...')
print('='*60)
run_ssh('ls -la /content/gemma_finetune_dataset.jsonl /content/colab_terminal_train.py && wc -l /content/gemma_finetune_dataset.jsonl')

# 4. 用 tmux 在后台启动训练（SSH 断开后继续运行）
print()
print('='*60)
print('4. 在后台启动训练 (tmux)...')
print('='*60)
run_ssh('cd /content && tmux new-session -d -s training "python colab_terminal_train.py 2>&1 | tee training.log" && echo "tmux session started"')

# 5. 等待几秒后检查状态
print()
print('='*60)
print('5. 检查训练状态...')
print('='*60)
time.sleep(3)
run_ssh('tmux ls 2>/dev/null && echo "---LOG---" && tail -5 /content/training.log 2>/dev/null || echo "tmux not running"')

print()
print('='*60)
print('✅ 训练已在后台启动！')
print('='*60)
print()
print('查看训练进度:')
print(f'  python .\\scripts\\check_training.py')
print()
print('或者手动运行:')
print(f'  ssh -o StrictHostKeyChecking=no -o ProxyCommand="cloudflared access ssh --hostname %h" root@{hostname} "tail -f /content/training.log"')
