#!/usr/bin/env python
import os
import sys
import argparse
import re
import yaml
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'quiz-to-audio'))
from polly import SimplePolly
from audio import speed_change_file

SPEAKER = 'Stephen'

def _split_text(content_dict):
    result_dict = {}
    for title, value in content_dict.items():
        if title.endswith('@'):
            title = title[:-1]
            period_split_values = [s for s in re.split('([^.]+. ?)', value) if s]
            comma_split_values = ['']
            for sentence in period_split_values:
                for phrase in [s for s in re.split('([^,]+, ?)', sentence) if s]:
                    prev = comma_split_values[-1].rstrip()
                    if prev.endswith(','):
                        if len(prev.split(' ')) < 5:
                            comma_split_values[-1] += phrase
                            continue
                    comma_split_values.append(phrase)
            comma_split_values = [s.strip() for s in comma_split_values if s.strip()]
            result_dict[title] = comma_split_values
        else:
            result_dict[title] = value

    return result_dict

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input_file", help="input file")
    args = parser.parse_args()

    try:
        with open(args.input_file, "r") as f:
            content = yaml.safe_load(f)
    except Exception as e:
        print(f'Error: {type(e).__name__}: {e}', file=sys.stderr)
        sys.exit(1)
    content = _split_text(content)
    print('------------------------------')
    for title, value in content.items():
        if isinstance(value, list):
            print(f'{title}:')
            for v in value:
                print(f'  {v}')
        else:
            print(f'{title}: {value}')
    print('------------------------------')
    # Make output dir
    # e.g. input-filename.yaml -> www/input-filename
    output_dir = os.path.join('www', os.path.splitext(args.input_file)[0])
    polly = SimplePolly(lang='en-US', speaker=SPEAKER)

    output_filenames = []
    speed = '80%'

    for title, value in content.items():
        output_filename = title.replace(' ', '-') + '.mp3'
        output_filename = os.path.join(output_dir, output_filename)
        if isinstance(value, list):
            for i, v in enumerate(value):
                filename = os.path.splitext(output_filename)[0] + f'-{i+1}.mp3'
                polly.make_audio_file(v, filename, speed)
                output_filenames.append(filename)
        else:
            polly.make_audio_file(value, output_filename, speed)
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
