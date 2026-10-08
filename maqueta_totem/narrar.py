import sys, glob, sherpa_onnx, soundfile as sf
d = 'voz/vits-piper-es_MX-claude-high'
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=glob.glob(d + '/*.onnx')[0], tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data'), num_threads=4)))
rows = [l.rstrip('\n').split('\t') for l in open('guion.tsv', encoding='utf-8') if l.strip()]
END = 172.5
for i, (t, txt) in enumerate(rows):
    t = float(t); slot = (float(rows[i + 1][0]) if i + 1 < len(rows) else END) - t - 0.25
    speed = 1.0
    while True:
        a = tts.generate(txt, sid=0, speed=speed); dur = len(a.samples) / a.sample_rate
        if dur <= slot or speed >= 1.12: break
        speed = min(1.12, speed * dur / slot + 0.01)
    sf.write(f'voz/clip_{i:02d}.wav', a.samples, a.sample_rate)
    print(f'{i:02d} t={t:6.1f} dur={dur:5.2f} slot={slot:5.2f} speed={speed:.2f}' + ('  <-- EXCEDE' if dur > slot else ''))
