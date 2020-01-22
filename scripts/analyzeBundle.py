#!/usr/bin/env python3
import os

bundleFilesDir = 'tmp/bundleSizeDownloads'
yarnLockFile = 'yarn.lock'
packagesFile = 'package.json'

def isDividerLine(line):
    # At least 80 chars, all slashes except the last (which is newline). The number is inconsistent for some reason.
    return (len(line)>=80
        and line.endswith("\n")
        and all([c=='/' for c in line[0:-1]]))

def isSpacerLine(line):
    # At least 80 chars, starting with "//", ending with "//\n", otherwise all spaces
    return (len(line)>=80
        and line.startswith("//") and line.endswith("//\n")
        and all([c==' ' for c in line[2:-3]]))

assert isDividerLine("////////////////////////////////////////////////////////////////////////////////////\n")
assert isSpacerLine("//                                                                                //\n")

def readFileLines(filename):
    f = open(filename, 'r')
    lines = f.readlines()
    f.close()
    return lines

def bundleFilesToSizeMap():
    sizesByFilename = {}
    for filename in os.listdir(bundleFilesDir):
        lines = readFileLines('%s/%s' % (bundleFilesDir, filename))
        sizesByFilename = {**unpackFile(lines), **sizesByFilename}
    return sizesByFilename

def unpackFile(lines):
    sizes = {}
    currentFileStart = None
    currentFileName = None

    for i in range(0,len(lines)):
        if i+4<len(lines) and isDividerLine(lines[i]) and isSpacerLine(lines[i+1]) and isSpacerLine(lines[i+3]) and isDividerLine(lines[i+4]):
            if currentFileName:
                fileContents = '\n'.join(lines[currentFileStart:i])
                sizes[currentFileName] = len(fileContents)
            currentFileStart = i+5
            currentFileName = lines[i+2].strip()[2:-2].strip()
    if currentFileName:
        fileContents = '\n'.join(lines[currentFileStart:i])
        sizes[currentFileName] = len(fileContents)
    
    return sizes

def ancestorPaths(filename):
    pathComponents = filename.split('/')
    return ['.']+['/'.join(pathComponents[0:i]) for i in range(1,len(pathComponents))]

def sumSizesInDirectories(sizesByFilename):
    sizesByDirectory = {}
    for filename in sizesByFilename:
        for path in ancestorPaths(filename):
            sizesByDirectory[path] = sizesByDirectory[path]+sizesByFilename[filename] if path in sizesByDirectory else sizesByFilename[filename]
    return sizesByDirectory

# Given the name of a yarn lockfile (yarn.lock), produce a dictionary from
# package -> array of dependencies of that package.
# The idea of this is to be able to identify when a package is depended on by
# only one other package, so that we can attribute the size of the depended-on
# package to the package that imported it.
#
#def yarnLockToDependencyGraph(lockfileName):
#    dependenciesByPackage = {}
#    lockfileLines = readFileLines(lockfileName)
#    
#    def backtrackToPackageName(lines, i):
#        #TODO
#        pass
#    def forwardOverDependencies(lines, i):
#        #TODO
#        pass
#    
#    for i in range(0,len(lines)):
#        if lockfileLines[0].strip()=='dependencies:':
#            packageName = backtrackToPackageName(lines, i)
#            dependencies = forwardOverDependencies(lines, i)
#            if packageName in dependencies:
#                dependenciesByPackage[packageName] = {**dependencies[packageName], **dependencies}
#            else:
#                dependenciesByPackage[packageName] = dependencies

def packagesFileToDependencyRoots(packagesFileName):
    f = open(packagesFileName, 'r')
    packagesJson = json.loads(f.read())
    f.close()
    return packagesJson[dependencies]

def rightalign(num, width):
    return (' ' * (width-len(str(num)))) + str(num)

#def getAdjustedPackageSizes(sizesByDirectory, dependencyRoots, dependencyGraph):
#    #TODO
#    return {}

sizesByFilename = bundleFilesToSizeMap()
sizesByDirectory = sumSizesInDirectories(sizesByFilename)

for path in sorted(list(sizesByDirectory.keys())):
    print("%s %s" % (rightalign(sizesByDirectory[path], 10), path))


