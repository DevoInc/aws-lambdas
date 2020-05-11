/**
 * Send events from Amazon CloudTrail Events to DEVO
 *
 * This AWS Lambda Function sends AWS CloudTrail Events to DEVO using DEVO nodejs-sdk library
*/
 /**
 * Following environment varaibles are required:
 * DEVO_CLIENT_PUBLIC_CERT_FILE: File name from existing file from 'certs' directory that contains the public certificate from the Devo domain (.crt file).
 * DEVO_CLIENT_PRIVATE_CERT_FILE: File name from existing file from 'certs' directory that contains the private certificate from the Devo domain (.key file)
 * DEVO_CA_CHAIN_CERT_FILE: File name from existing file from 'certs' directory that contains the CA chain for Devo platform (chain_eu.crt or chain_us.crt)
 * DEVO_URL: Devo platform URL (Ex.: eu.elb.relay.logtrust.net)
 * DEVO_PORT: Devo platform port (Ex.: 443)
*/

'use strict';

const aws  = require('aws-sdk');
const async = require('async');
const zlib = require('zlib');
const fs = require('fs');
const devo = require('@devo/nodejs-sdk');

var EVENT_SOURCE_TO_TRACK = /.*/;
var EVENT_NAME_TO_TRACK   = /.*/;

var s3 = new aws.S3();

exports.handler = function(event, context, callback) {

    //console.log("Received event:" + JSON.stringify(event, null, 2));

    let chainCertFile = fs.readFileSync('./certs/' + process.env.DEVO_CA_CHAIN_CERT_FILE);
    let publicCertFile = fs.readFileSync('./certs/' + process.env.DEVO_CLIENT_PUBLIC_CERT_FILE);
    let privateKeyFile = fs.readFileSync('./certs/' + process.env.DEVO_CLIENT_PRIVATE_CERT_FILE);

    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;

    async.waterfall([
        function fetchLogFromS3(next){
            //console.log('Fetching compressed log from S3...');
            s3.getObject({
                Bucket: srcBucket,
                Key: srcKey
            },
            next);
        },
        function uncompressLog(response, next){
            //console.log("Uncompressing log...");
            zlib.gunzip(response.Body, next);
        },
        function publishNotifications(jsonBuffer, next) {
            //console.log('Filtering log...');
            var json = jsonBuffer.toString();
            //console.log('CloudTrail JSON from S3:', json);
            var records;
            try {
                records = JSON.parse(json);
            } catch (err) {
                next('Unable to parse CloudTrail JSON: ' + err);
                return;
            }

            //console.log("Received records:" + JSON.stringify(records, null, 2));

            var matchingRecords = records
                .Records
                .filter(function(record) {
                    return record.eventSource.match(EVENT_SOURCE_TO_TRACK)
                        && record.eventName.match(EVENT_NAME_TO_TRACK);
                });

            //console.log('Publishing ' + matchingRecords.length + ' notification(s) in parallel...');
            async.each(
                matchingRecords,
                function(record, publishComplete) {
                    //console.log('Publishing notification: ', record);

                    let devoTag= "cloud.aws.cloudtrail.events.";
                    var AWSAccountId = "";
                    if (record.userIdentity !== undefined && record.userIdentity.accountId !== undefined){
                        AWSAccountId = record.userIdentity.accountId;
                    } else if(record.account !== undefined){
                        AWSAccountId = record.account;
                    } else if(record.recipientAccountId !== undefined){
                        AWSAccountId = record.recipientAccountId;
                    }

                    var AWSRegion = "";
                    if (record.awsRegion !== undefined){
                        AWSRegion = record.awsRegion;
                    } else if(record.region !== undefined){
                        AWSRegion = record.region;
                    }

                    devoTag = devoTag + AWSAccountId + "." + AWSRegion;
                    //console.log('Syslog tag value: ', devoTag);

                    if (AWSAccountId.trim() != "" && AWSRegion.trim() != "") {
                        // DEVO sender opts
                        let sender = devo.sender({
                          host: process.env.DEVO_URL,
                          port: process.env.DEVO_PORT,
                          ca: Buffer.from(chainCertFile, 'utf8'),
                          cert: Buffer.from(publicCertFile, 'utf8'),
                          key: Buffer.from(privateKeyFile, 'utf8'),
                          tag: devoTag
                        });

                        // CloudWatch Event data
                        const payload = record;
                        sender.send(payload, () => {
                          callback(null, `Lambda successfully ended.`);
                        });
                      } else {
                        callback(new Error("At least one field is having a empty value: AWSAccountId[" + AWSAccountId + "], AWSRegion[" + AWSRegion +"]"));
                      }
                },
                next
            );
        }
    ], function (err) {
        if (err) {
            console.error('Failed to publish notifications: ', err);
        } else {
            console.log('Successfully published all notifications.');
        }
        callback(null,"message");
    });
};
