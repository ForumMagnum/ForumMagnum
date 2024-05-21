#!/usr/bin/env python3
import argparse
import time
from openai import OpenAI

client = OpenAI()

parser = argparse.ArgumentParser(prog='progname')
parser.add_argument('--train', action='store', dest='trainFile', help='training file name')
parser.add_argument('--test', action='store', dest='testFile', help='testing file name')
args = parser.parse_args()

trainFile = args.trainFile
testFile = args.testFile

print('Train File: ', trainFile)
print('Test File: ', testFile)

def startFineTuningJob():
  print("Uploading files")
  uploadedTrain = client.files.create(
    file=open(trainFile, "rb"),
    purpose="fine-tune"
  )
  print("    Uploaded train file: %s" % uploadedTrain)
  
  uploadedTest = client.files.create(
    file=open(testFile, "rb"),
    purpose="fine-tune"
  )
  print("    Uploaded test file: %s" % uploadedTest)
  
  
  print("Starting fine-tuning job")
  createdJob = client.fine_tuning.jobs.create(
    training_file=uploadedTrain.id,
    validation_file=uploadedTest.id,
    model="babbage-002"
  )
  
  fineTuneJobId = createdJob.id
  print("Created fine-tuning job: %s" % fineTuneJobId)
  return fineTuneJobId 

def monitorFineTuningJob(jobId):
  while True:
    status = client.fine_tuning.jobs.retrieve(jobId)
    if status.status == 'running' or status.status == 'validating_files':
      print("  Fine-tune is running...")
      time.sleep(10)
    else:
      print(status)
      break;
  print("Finished");

jobId = startFineTuningJob()
monitorFineTuningJob(jobId)

