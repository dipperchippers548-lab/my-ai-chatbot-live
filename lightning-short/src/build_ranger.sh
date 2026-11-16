#!/bin/sh
# build the ranger: MPFB human + clothes + expression shape keys + hand-made poses + retargeted CMU mocap clips
M=$(pwd)/mocap
blender -b --python src/make_character.py -- $(pwd)/assets/ranger.glb "{\"macro\":{\"gender\":1,\"age\":0.62,\"muscle\":0.6,\"weight\":0.55},\"skin\":\"middleage_caucasian_male\",\"hair\":\"short02\",\"eyebrows\":\"eyebrow001\",\"clips\":[{\"bvh\":\"$M/08_01.bvh\",\"name\":\"walk\",\"secs\":2.3},{\"bvh\":\"$M/79_73.bvh\",\"name\":\"scared\",\"secs\":7},{\"bvh\":\"$M/77_19.bvh\",\"name\":\"limp\",\"secs\":5},{\"bvh\":\"$M/76_05.bvh\",\"name\":\"swat\",\"secs\":7},{\"bvh\":\"$M/82_08.bvh\",\"name\":\"idlestand\",\"secs\":5}]}"
