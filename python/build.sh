#!/usr/bin/env bash


rm -f ./dist/*

#Generate simple txt lambda
fuse-zip ./dist/aws_s3_lambda_devo_txt.zip /mnt
cp config.json.example /mnt/config.json
cp lambda_function_txt.py /mnt/lambda_function.py
cp README.txt /mnt/README.txt
cp -r devo /mnt/
umount /mnt


#Generate json lambda
fuse-zip ./dist/aws_s3_lambda_devo_json.zip /mnt
cp config.json.example /mnt/config.json
cp lambda_function_json.py /mnt/lambda_function.py
cp README.txt /mnt/README.txt
cp -r devo /mnt/
umount /mnt

#Generate cloudtrail json lambda
fuse-zip ./dist/aws_s3_lambda_devo_cloudtrail_json.zip /mnt
cp cloudtrail_config.json.example /mnt/config.json
cp lambda_function_cloudtrail_json.py /mnt/lambda_function.py
cp README.txt /mnt/README.txt
cp -r devo /mnt/
umount /mnt
