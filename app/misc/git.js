"use strict";
var Git = require("nodegit");
function getAllCommits(repoPath, callback) {
    Git.Repository.open(repoPath)
        .then(function (repo) {
        return repo.getMasterCommit();
    })
        .then(function (firstCommitOnMaster) {
        var history = firstCommitOnMaster.history(Git.Revwalk.SORT.Time);
        history.on("end", function (commits) {
            callback(commits);
        });
        history.start();
    });
}
function displayModifiedFiles(repoPath) {
    var modifiedFiles = [];
    Git.Repository.open(repoPath)
        .then(function (repo) {
        repo.getStatus().then(function (statuses) {
            statuses.forEach(addModifiedFile);
            clearModifiedFilesList();
            modifiedFiles.forEach(displayModifiedFile);
            function addModifiedFile(file) {
                var path = file.path();
                var modification = calculateModification(file);
                modifiedFiles.push({
                    filePath: path,
                    fileModification: modification
                });
            }
            function calculateModification(status) {
                if (status.isNew()) {
                    return "NEW";
                }
                else if (status.isModified()) {
                    return "MODIFIED";
                }
                else if (status.isTypechange()) {
                    return "TYPECHANGE";
                }
                else if (status.isRenamed()) {
                    return "RENAMED";
                }
                else if (status.isIgnored()) {
                    return "IGNORED";
                }
            }
            function clearModifiedFilesList() {
                var filePanel = document.getElementById('file-panel');
                while (filePanel.firstChild) {
                    filePanel.removeChild(filePanel.firstChild);
                }
            }
            function displayModifiedFile(file) {
                var filePath = document.createElement("p");
                filePath.innerHTML = file.filePath;
                var fileElement = document.createElement("div");
                fileElement.className = "file";
                fileElement.appendChild(filePath);
                document.getElementById('file-panel').appendChild(fileElement);
            }
        });
    });
}
function getDiffForCommit(commit) {
    console.log("commit " + commit.sha());
    console.log("Author:", commit.author().name() +
        " <" + commit.author().email() + ">");
    console.log("Date:", commit.date());
    console.log("\n    " + commit.message());
    return commit.getDiff();
}
function printFormattedDiff(commit) {
    getDiffForCommit(commit).done(function (diffList) {
        diffList.forEach(function (diff) {
            diff.patches().then(function (patches) {
                patches.forEach(function (patch) {
                    patch.hunks().then(function (hunks) {
                        hunks.forEach(function (hunk) {
                            hunk.lines().then(function (lines) {
                                console.log("diff", patch.oldFile().path(), patch.newFile().path());
                                console.log(hunk.header().trim());
                                lines.forEach(function (line) {
                                    console.log(String.fromCharCode(line.origin()) +
                                        line.content().trim());
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
