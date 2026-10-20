"""
Colab GPU Remote Trainer — Unified CLI

Usage:
  python ssh_colab.py connect      Test SSH connection & GPU info
  python ssh_colab.py upload       Upload dataset + training script to Colab
  python ssh_colab.py train        Upload + start training in tmux (survives disconnect)
  python ssh_colab.py status       Check training logs, process, GPU, output files
  python ssh_colab.py download     Download trained models back to local
  python ssh_colab.py logs [tail]  View training logs (add 'tail' for live follow)
"""

import subprocess
import sys
import os
import time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOSTNAME = 'pressure-turbo-farming-charles.trycloudflare.com'
USERNAME = 'root'
REMOTE_DIR = '/content'

CLOUDFLARED = r'C:\Users\81102\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET = os.path.join(SCRIPT_DIR, 'gemma_finetune_dataset.jsonl')
TRAIN_SCRIPT = os.path.join(SCRIPT_DIR, 'colab_terminal_train.py')

SSH_BASE = [
    'ssh',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=NUL',
    '-o', 'BatchMode=yes',
    '-o', 'PreferredAuthentications=publickey',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
]

SCP_BASE = [
    'scp',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=NUL',
    '-o', 'BatchMode=yes',
    '-o', 'PreferredAuthentications=publickey',
]


def _proxy_cmd():
    return f'ProxyCommand="{CLOUDFLARED}" access ssh --hostname %h'


def ssh(command, stream=True):
    """Execute command on Colab via SSH, optionally streaming output."""
    cmd = SSH_BASE + ['-o', _proxy_cmd(), '-tt', f'{USERNAME}@{HOSTNAME}', command]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            stdin=subprocess.PIPE, text=True, bufsize=1)
    output = []
    for line in proc.stdout:
        output.append(line)
        if stream:
            print(line, end='')
            sys.stdout.flush()
    proc.wait()
    return proc.returncode, ''.join(output)


def scp_upload(local_path, remote_path):
    """Upload a file via SCP."""
    fname = os.path.basename(local_path)
    print(f'Uploading {fname} ...')
    cmd = SCP_BASE + ['-o', _proxy_cmd(), local_path, f'{USERNAME}@{HOSTNAME}:{remote_path}']
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    out = proc.communicate()[0]
    if out:
        print(f'  {out.strip()}')
    proc.wait()
    ok = proc.returncode == 0
    print(f'  {"OK" if ok else "FAILED"}')
    return ok


def scp_download(remote_path, local_path):
    """Download a file or directory via SCP."""
    cmd = SCP_BASE + ['-o', _proxy_cmd(), '-r', f'{USERNAME}@{HOSTNAME}:{remote_path}', local_path]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    for line in proc.stdout:
        print(line, end='')
    proc.wait()
    return proc.returncode == 0


# ============================================================
# Subcommands
# ============================================================

def cmd_connect():
    """Test SSH connection and show GPU info."""
    print('=' * 60)
    print('Testing SSH connection...')
    print('=' * 60)

    ret, out = ssh('whoami && nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader')
    if ret != 0:
        print('\nConnection FAILED')
        sys.exit(1)

    print('\n' + '=' * 60)
    print('Remote files in /content/:')
    print('=' * 60)
    ssh('ls -lh /content/')


def cmd_upload():
    """Upload dataset and training script to Colab."""
    print('=' * 60)
    print('Uploading files to Colab...')
    print('=' * 60)

    # Upload both files
    ok1 = scp_upload(DATASET, f'{REMOTE_DIR}/gemma_finetune_dataset.jsonl')
    ok2 = scp_upload(TRAIN_SCRIPT, f'{REMOTE_DIR}/colab_terminal_train.py')

    if not (ok1 and ok2):
        print('\nUpload FAILED')
        sys.exit(1)

    # Verify
    print()
    print('=' * 60)
    print('Verifying files...')
    print('=' * 60)
    ssh(f'ls -lh /content/gemma_finetune_dataset.jsonl /content/colab_terminal_train.py && wc -l /content/gemma_finetune_dataset.jsonl')

    print('\nUpload complete.')


def cmd_train():
    """Upload files then start training in a tmux session."""
    # Check files locally first
    if not os.path.exists(DATASET):
        print(f'Dataset not found: {DATASET}')
        sys.exit(1)
    if not os.path.exists(TRAIN_SCRIPT):
        print(f'Training script not found: {TRAIN_SCRIPT}')
        sys.exit(1)

    # Check SSH
    print('Checking Colab connection...')
    ret, _ = ssh('whoami', stream=False)
    if ret != 0:
        print('Cannot connect to Colab. Is the runtime running?')
        sys.exit(1)

    # Upload
    cmd_upload()

    # Kill any existing training session
    print()
    print('Cleaning up old sessions...')
    ssh('tmux kill-session -t training 2>/dev/null; echo done')

    # Start training in tmux
    print()
    print('=' * 60)
    print('Starting training in tmux (SSH disconnect safe)...')
    print('=' * 60)

    train_cmd = 'cd /content && tmux new-session -d -s training "python colab_terminal_train.py 2>&1 | tee training.log" && echo "tmux started"'
    ssh(train_cmd)

    time.sleep(3)

    print()
    print('=' * 60)
    print('Checking training startup...')
    print('=' * 60)
    ssh('tmux capture-pane -t training -p 2>/dev/null | tail -20 || echo "tmux not running"')

    print()
    print('=' * 60)
    print('Training started! Monitor with:')
    print(f'  python {os.path.basename(__file__)} status')
    print(f'  python {os.path.basename(__file__)} logs tail')
    print('=' * 60)


def cmd_status():
    """Check training status: tmux session, logs, GPU, output files."""
    print('=' * 60)
    print('Training Status')
    print('=' * 60)

    print('\n--- tmux session ---')
    ssh('tmux ls 2>/dev/null || echo "No tmux sessions"')

    print('\n--- Last 15 log lines ---')
    ssh('tail -15 /content/training.log 2>/dev/null || echo "No log file yet"')

    print('\n--- GPU usage ---')
    ssh('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader 2>/dev/null || echo "nvidia-smi not found"')

    print('\n--- Python processes ---')
    ssh('ps aux | grep -E "python|train" | grep -v grep || echo "No training process"')

    print('\n--- Output files ---')
    ssh('du -sh /content/gemma4_diary_* 2>/dev/null || echo "No output files yet"')


def cmd_logs():
    """View training logs. Add 'tail' argument for live follow."""
    tail = len(sys.argv) > 2 and sys.argv[2] == 'tail'
    if tail:
        print('Following logs (Ctrl+C to stop)...')
        ssh('tail -f /content/training.log 2>/dev/null || echo "No log file"')
    else:
        ssh('cat /content/training.log 2>/dev/null || echo "No log file"')


def cmd_download():
    """Download trained models from Colab."""
    output_dir = os.path.join(SCRIPT_DIR, 'outputs')
    os.makedirs(output_dir, exist_ok=True)

    models = ['gemma4_diary_lora', 'gemma4_diary_merged', 'gemma4_diary_gguf']

    for m in models:
        remote = f'{REMOTE_DIR}/{m}'
        local = os.path.join(output_dir, m)

        # Check if exists on remote
        ret, _ = ssh(f'test -d {remote} && echo exists || echo missing', stream=False)
        if 'missing' in _:
            print(f'  {m}/ — not found on remote, skipping')
            continue

        print(f'Downloading {m}/ ...')
        scp_download(remote, local)

    print(f'\nModels downloaded to: {output_dir}')


def print_usage():
    print(__doc__)


# ============================================================
# Main
# ============================================================

COMMANDS = {
    'connect':  cmd_connect,
    'upload':   cmd_upload,
    'train':    cmd_train,
    'status':   cmd_status,
    'logs':     cmd_logs,
    'download': cmd_download,
}

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print_usage()
        sys.exit(1)

    COMMANDS[sys.argv[1]]()
