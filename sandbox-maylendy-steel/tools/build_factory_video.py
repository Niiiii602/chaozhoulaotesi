r"""Bake three MayLendy marks into the existing workshop film with local FFmpeg.

Usage: python tools/build_factory_video.py --ffmpeg C:\path\ffmpeg.exe --work-dir C:\temp\video
The original MP4 is preserved. FFmpeg and temporary files are kept outside the site.
"""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, struct, subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/factory-workshop-clean.mp4'
OUTPUT = ROOT / 'assets/factory-workshop-maylendy.mp4'
POSITIONS = [(0.23, 0.22), (0.5, 0.5), (0.77, 0.78)]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(ffmpeg, path):
    result = subprocess.run([str(ffmpeg), '-hide_banner', '-i', str(path)], capture_output=True, text=True, encoding='utf-8', errors='replace')
    duration = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', result.stderr)
    video = re.search(r'Video:\s*([^,\s]+).*?\b(\d{2,5})x(\d{2,5})\b', result.stderr)
    if not duration or not video:
        raise RuntimeError('Could not read video metadata: ' + result.stderr)
    return {'durationSeconds': int(duration[1])*3600 + int(duration[2])*60 + float(duration[3]), 'codec': video[1], 'width': int(video[2]), 'height': int(video[3]), 'audioStreams': re.findall(r'Audio:\s*([^,\s]+)', result.stderr)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ffmpeg', type=Path, required=True)
    parser.add_argument('--work-dir', type=Path, required=True)
    parser.add_argument('--font', type=Path, default=Path(os.environ.get('WINDIR', r'C:\Windows'))/'Fonts/arialbd.ttf')
    args = parser.parse_args()
    ffmpeg = args.ffmpeg.resolve(); work = args.work_dir.resolve()
    if not ffmpeg.is_file() or not SOURCE.is_file() or not args.font.is_file():
        raise FileNotFoundError('The FFmpeg executable, original MP4 and font must exist.')
    if ROOT == work or ROOT in work.parents:
        raise ValueError('Keep temporary work outside the website directory.')
    work.mkdir(parents=True, exist_ok=True)
    source_hash = sha(SOURCE)
    original = ROOT.parent/'assets/factory-workshop-clean.mp4'
    if original.exists() and sha(original) != source_hash:
        raise ValueError('Sandbox source does not match the original factory film.')
    before = probe(ffmpeg, SOURCE)
    shutil.copy2(args.font, work/'watermark-font.ttf')
    fontsize = round(before['height'] * 0.1)
    filters = ','.join(
        f'drawtext=fontfile=watermark-font.ttf:text=MayLendy:fontsize={fontsize}:fontcolor=white@0.45:'
        f'borderw=1:bordercolor=black@0.3:shadowcolor=black@0.18:shadowx=1:shadowy=1:'
        f'x=w*{x}-tw/2:y=h*{y}-th/2' for x,y in POSITIONS
    )
    command = [str(ffmpeg), '-nostdin', '-hide_banner', '-loglevel', 'warning', '-y', '-i', str(SOURCE),
               '-map', '0:v:0', '-map', '0:a?', '-vf', filters, '-filter_threads', '2',
               '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-threads', '4',
               '-c:a', 'copy', '-map_metadata', '-1', '-metadata', 'title=MayLendy factory workshop',
               '-movflags', '+faststart', str(OUTPUT)]
    subprocess.run(command, cwd=work, check=True, timeout=150)
    after = probe(ffmpeg, OUTPUT)
    assert before['width']==after['width'] and before['height']==after['height']
    assert abs(before['durationSeconds']-after['durationSeconds']) < .1
    assert before['audioStreams']==after['audioStreams']
    decoded = subprocess.run([str(ffmpeg), '-nostdin', '-v', 'error', '-i', str(OUTPUT), '-map', '0:v:0',
                              '-progress', 'pipe:1', '-nostats', '-f', 'null', '-'], capture_output=True, text=True, check=True, timeout=60)
    if decoded.stderr.strip():
        raise RuntimeError('Video decode errors: '+decoded.stderr)
    frames = int(re.findall(r'^frame=(\d+)$',decoded.stdout,re.M)[-1])
    data = OUTPUT.read_bytes(); atoms=[]; offset=0
    while offset+8<=len(data):
        size,kind=struct.unpack('>I4s',data[offset:offset+8]);header=8
        if size==1:size=struct.unpack('>Q',data[offset+8:offset+16])[0];header=16
        if size==0:size=len(data)-offset
        if size<header:raise ValueError('Invalid MP4 atom')
        atoms.append(kind.decode('ascii'));offset+=size
    assert atoms.index('moov') < atoms.index('mdat'), 'MP4 metadata must precede media data'
    previews=ROOT/'review/factory-video-frames';previews.mkdir(exist_ok=True)
    for second in [1,8,16,24,33]:
        subprocess.run([str(ffmpeg), '-nostdin', '-v', 'error', '-y', '-ss', str(second), '-i', str(OUTPUT),
                        '-frames:v', '1', '-q:v', '2', str(previews/f'frame-{second:02d}.jpg')], check=True, timeout=20)
    assert sha(SOURCE)==source_hash
    manifest={'source':'assets/factory-workshop-clean.mp4','sourceSha256':source_hash,'output':'assets/factory-workshop-maylendy.mp4',
              'outputSha256':sha(OUTPUT),'sourceBytes':SOURCE.stat().st_size,'outputBytes':OUTPUT.stat().st_size,
              'sourceMetadata':before,'outputMetadata':after,'decodedFrames':frames,'fullDecode':'passed','fastStart':True,
              'watermark':{'text':'MayLendy','count':3,'positionsNormalized':POSITIONS,'font':'Arial Bold','fontSizePixels':fontsize,
                           'opacity':0.45,'application':'Burned into every video frame; independent of HTML, fullscreen or download.'},
              'sourceUnchanged':True,'audio':'Original audio streams copied without re-encoding; no added music.',
              'encoding':{'video':'H.264 / libx264','pixelFormat':'yuv420p','crf':20,'preset':'medium'},
              'previewFramesSeconds':[1,8,16,24,33]}
    (ROOT/'review/factory-video-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False),flush=True)


if __name__=='__main__':
    main()
