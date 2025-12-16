#!/usr/bin/env bash

# Process videos for EA Forum wrapped
# See /packages/lesswrong/components/ea-forum/wrapped/videos.ts for details

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

	# Export final frame as PNG (with alpha)
	# For most animations this is what we want, but sometimes you may wish to
	# pick a different frame manually. For instance, to export the frame 5
	# seconds into the video run:
	# ffmpeg -y -c:v libvpx-vp9 -i "$input" \
	#   -vf "trim=start=5,setpts=PTS-STARTPTS" \
	#   -frames:v 1 -pix_fmt rgba "$png_output"
	ffmpeg -y -c:v libvpx-vp9 -i "$input" -vf reverse -frames:v 1 \
		-pix_fmt rgba "$png_output"
done
