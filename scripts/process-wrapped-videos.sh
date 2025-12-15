#!/usr/bin/env bash

shopt -s nullglob

for input in *-webm.webm; do
	# Strip the "-webm.webm" suffix
	base="${input%-webm.webm}"
	mov_output="${base}-mov.mov"
	png_output="${base}-png.png"

	echo "Processing: $input"

	# Create MOV for Safari
	ffmpeg -c:v libvpx-vp9 -i "$input" -vf "scale=1080:1920" -c:v prores_ks \
		-profile:v 4444 -pix_fmt yuva444p10le -q:v 64 "$mov_output"

	# Export first frame as PNG (with alpha)
	ffmpeg -y -c:v libvpx-vp9 -i "$input" -frames:v 1 -pix_fmt rgba "$png_output"
done
