import subprocess
import time
import os
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

hostname = 'pressure-turbo-farming-charles.trycloudflare.com'
username = 'root'
cloudflared_path = r'C:\Users\81102\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe'
project_root = r'C:\Users\81102\Desktop\partdro\unsloth_finetuning_gemma4\training_terminal_google_colab_runtime'
proxy_cmd = f'"{cloudflared_path}" access ssh --hostname %h'

def run_ssh(command):
    ssh_cmd = [
        'ssh', '-tt',
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
    proc = subprocess.Popen(ssh_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    for line in proc.stdout:
        print(line, end='')
    proc.wait()

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
    proc = subprocess.Popen(scp_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    for line in proc.stdout:
        print(f'  {line.strip()}')
    proc.wait()
    return proc.returncode == 0

# 1. 上传数据集
print('1. 上传数据集...')
dataset_local = os.path.join(project_root, 'gemma_finetune_dataset.jsonl')
upload_file(dataset_local, '/content/gemma_finetune_dataset.jsonl')

# 2. 上传新脚本
print()
print('2. 上传训练脚本...')
script_local = os.path.join(project_root, 'colab_terminal_train.py')
upload_file(script_local, '/content/colab_terminal_train.py')

# 3. 启动新训练
print()
print('3. 启动新训练 (tmux)...')
run_ssh('cd /content && tmux new-session -d -s training "python colab_terminal_train.py 2>&1 | tee training.log" && echo "tmux session started"')

# 4. 检查
time.sleep(3)
print()
print('4. 检查状态...')
run_ssh('tmux ls 2>/dev/null && echo "---LOG---" && tail -5 /content/training.log 2>/dev/null || echo "not running"')
