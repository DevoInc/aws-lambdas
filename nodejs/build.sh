#!/usr/bin/env bash


rm -f ./dist/*

#Generate cloudtrail to devo nodejs lambda
fuse-zip ./dist/aws_s3_lambda_devo_cloudtrail.zip /mnt
cp README.md /mnt/README.md
cp package.json /mnt/package.json
cp index_cloudtrail.js /mnt/index.js
cp -r node_modules /mnt/
cp -r certs /mnt/
umount /mnt


#Generate cloudtrail to devo nodejs lambda
fuse-zip ./dist/aws_s3_lambda_devo_cloudwatch.zip /mnt
cp README.md /mnt/README.md
cp package.json /mnt/package.json
cp index_cloudwatch.js /mnt/index.js
cp -r node_modules /mnt/
cp -r certs /mnt/
umount /mnt
