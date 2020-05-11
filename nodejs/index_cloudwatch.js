/**
 * Send events from Amazon Cloudwatch Events to DEVO
 *
 * This AWS Lambda Function sends Amazon Cloudwatch Events to DEVO using DEVO nodejs-sdk library
 *
 * @author Raúl Arriola Gómez
 * @author César Jimenez
 * @author Felipe Conde
 *
 * @version 0.0.4
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

const devo = require('@devo/nodejs-sdk');
const fs = require('fs');
const zlib = require('zlib');

/**
 * Handler called when the lambda is triggered
 * @param {*} event Event that triggered the execution
 * @param {*} context Context
 * @param {Function} callback Callback function
 */
exports.handler = (event, context, callback) => {

  //console.log('Received event:\n', JSON.stringify(event, null, 2));

  // Allows for using callbacks as finish/error-handlers
  context.callbackWaitsForEmptyEventLoop = false;

  let chainCertFile = fs.readFileSync('./certs/' + process.env.DEVO_CA_CHAIN_CERT_FILE);
  let publicCertFile = fs.readFileSync('./certs/' + process.env.DEVO_CLIENT_PUBLIC_CERT_FILE);
  let privateKeyFile = fs.readFileSync('./certs/' + process.env.DEVO_CLIENT_PRIVATE_CERT_FILE);

  //console.log('publicCertFile:\n', publicCertFile.toString());
  //console.log('privateKeyFile:\n', privateKeyFile.toString());

  let devoTag= "cloud.aws.cloudwatch.events.";
  var AWSAccountId;
  if(event.account !== undefined){
    AWSAccountId = event.account;
  }
  var AWSRegion;
  if(event.region !== undefined){
    AWSRegion = event.region;
  }

  var errorInDetailFields = false;
  var eventDetail;
  if (event.detail !== undefined){
    eventDetail= event.detail;
    if (AWSAccountId !== undefined && eventDetail.userIdentity !== undefined && eventDetail.accountId !== undefined){
      AWSAccountId = eventDetail.accountId;
    }

    if (AWSRegion !== undefined && eventDetail.awsRegion !== undefined){
      AWSRegion = eventDetail.awsRegion;
    }
    if (eventDetail.eventVersion === undefined
        || eventDetail.eventTime === undefined
        || eventDetail.eventSource === undefined
        || eventDetail.eventName === undefined
        || eventDetail.eventID === undefined
        || eventDetail.eventType === undefined
    ){
      errorInDetailFields = true;
    }
  }
  //console.log('errorInDetailFields: ', errorInDetailFields);

  devoTag = devoTag + AWSAccountId + "." + AWSRegion;
  //console.log('Syslog tag value: ', devoTag);

  if (AWSAccountId.trim() != "" && AWSRegion.trim() != "" && errorInDetailFields != true) {
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
    var payload = event;

    sender.send(payload, () => {
      //console.log(`DEVO sender.send executed`);
      // Callback function to end the AWS Lambda function
      callback(null, `Lambda successfully ended.`);
    });
  } else {
    var errorText = "Unknown error.";
    if (errorInDetailFields == true){
      errorText = "At least one of 'detail.event*' fields is having an empty value.";
      console.log('Received event:\n', JSON.stringify(event, null, 2));
    }else{
      errorText = "At least one field is having an empty value: AWSAccountId[" + AWSAccountId + "], AWSRegion[" + AWSRegion + "]";
    }
    callback(new Error(errorText));
  }
};
