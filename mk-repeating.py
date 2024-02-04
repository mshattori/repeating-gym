#!/usr/bin/env python
import os
import sys
import argparse
import yaml
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'quiz-to-audio'))
from polly import SimplePolly

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input_file", help="input file")
    args = parser.parse_args()

    with open(args.input_file, "r") as f:
        content = yaml.safe_load(f)
    # Make output dir
    # e.g. input-filename.yaml -> www/input-filename
    output_dir = os.path.join('www', os.path.splitext(args.input_file)[0])
    polly = SimplePolly(lang='en-US')

    output_filenames = []

    for title, value in content.items():
        output_filename = title.replace(' ', '-') + '.mp3'
        output_filename = os.path.join(output_dir, output_filename)
        if isinstance(value, list):
            for i, v in enumerate(value):
                filename = os.path.splitext(output_filename)[0] + f'-{i}.mp3'
                polly.make_audio_file(v, filename)
                output_filenames.append(filename)
        else:
            polly.make_audio_file(value, output_filename)
            output_filenames.append(output_filename)

    stem_name = os.path.basename(os.path.splitext(args.input_file)[0])
    audioJsonPath = os.path.join('www', f'{stem_name}.json')
    # skip 'www'
    output_filenames = [f[len('www/'):] if f.startswith('www') else f for f in output_filenames]
    with open(audioJsonPath, 'w') as f:
        json.dump(output_filenames, f, indent=4)

    indexJsonPath = os.path.join('www', 'index.json')
    if os.path.exists(indexJsonPath):
        with open(indexJsonPath, 'r') as f:
            index = json.load(f)
    else:
        index = []
    index.append(os.path.basename(audioJsonPath))
    index = list(set(index))  # remove duplicate
    index = sorted(index)
    with open(indexJsonPath, 'w') as f:
        json.dump(index, f, indent=4)
