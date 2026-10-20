import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

hostname = 'pressure-turbo-farming-charles.trycloudflare.com'
username = 'root'
cloudflared_path = r'C:\Users\81102\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe'
proxy_cmd = f'"{cloudflared_path}" access ssh --hostname %h'

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
    proc = subprocess.Popen(ssh_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    for line in proc.stdout:
        print(line, end='')
    proc.wait()
    return proc.returncode

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'tail':
        # 持续查看日志
        run_ssh('tail -f /content/training.log')
    else:
        # 查看完整日志
        print('='*60)
        print('训练日志:')
        print('='*60)
        run_ssh('cat /content/training.log 2>/dev/null || echo "日志文件不存在"')
        
        print()
        print('='*60)
        print('进程状态:')
        print('='*60)
        run_ssh('ps aux | grep -E "python|train" | grep -v grep || echo "无运行中的进程"')
        
        print()
        print('='*60)
        print('输出文件:')
        print('='*60)
        run_ssh('ls -la /content/gemma4_diary_* 2>/dev/null || echo "尚无输出"')
