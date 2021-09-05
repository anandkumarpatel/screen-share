#!/usr/bin/env bash
# ffmpeg -y -re -i bunny.mp4 -keyint_min 96 -x264opts "keyint=96:min-keyint=96:no-scenecut" -g 96 -r:v 24 -s 320x180 -b:v 256k -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -c:a aac -ac 1 -ar 48000 -b:a 96k -hls_time 4 -hls_playlist_type vod -hls_segment_filename bunny/180p%03d.ts bunny/180p.m3u8
set -ex

# Usage create-vod-hls.sh SOURCE_FILE [OUTPUT_NAME]
[[ ! "${1}" ]] && echo "Usage: create-vod-hls.sh SOURCE_FILE [OUTPUT_NAME]" && exit 1

#########################################################################

source="${1}"
target="${2}"
mkdir -p ${target}

# # key generation
# keyURI="${3}"
# echo 'Generating encryption key'
# openssl rand 16 > ${target}.key
# keyIV=$(openssl rand -hex 16)
# keyinfo="${keyURI}/${target}.key
# ${target}.key
# $keyIV"
# echo -e "${keyinfo}" > ${target}.keyinfo

# static parameters
static_params="-keyint_min 96 -x264opts keyint=96:min-keyint=96:no-scenecut -g 96 -r:v 24 -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -c:a aac -ac 1 -ar 48000 -b:a 96k -hls_time 4 -hls_playlist_type vod -hls_key_info_file ${target}.keyinfo"

# misc params
misc_params="-hide_banner -y"

master_playlist="#EXTM3U
#EXT-X-VERSION:3
"

# rendition fields
resolution="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${source})"
bitrate="$(ffprobe -i ${source} 2>&1 | awk '/Video:/ {print $12}')"
audiorate="$(ffprobe -i ${source} 2>&1 | awk '/Audio:/ {print $13}')"

# calculated field
height="$(echo ${resolution} | cut -d 'x' -f 2)"
name="${height}p"
bandwidth=$(echo ${bitrate})
bandwidth=$((${bandwidth}*1000))

cmd=" ${static_params} "
# cmd+=" -s ${resolution} -b:v ${bitrate} -b:a ${audiorate}"
cmd+=" -hls_segment_filename ${target}/${name}_%03d.ts ${target}/${name}.m3u8"

# add rendition entry in the master playlist
master_playlist+="#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${name}.m3u8\n"

echo -e "Converting "
ffmpeg ${misc_params} -i ${source} ${cmd}


# create master playlist file
echo -e "${master_playlist}" > ${target}/playlist.m3u8

echo "Done - encoded HLS is at ${target}/"
