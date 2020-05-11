'use strict';

const PATH_TASKS = '/jobs';
const PATH_TASK = '/job/';
const PATH_TASK_STOP = PATH_TASK + 'stop/';
const PATH_TASK_START = PATH_TASK + 'start/';
const PATH_TASK_REMOVE = PATH_TASK + 'remove/';

module.exports = {
  getTasks: () => PATH_TASKS,
  getTasksByType: type => PATH_TASKS + '/' + type,
  getTaskInfo: taskId => PATH_TASK + taskId,
  startTask: taskId => PATH_TASK_START + taskId,
  stopTask: taskId => PATH_TASK_STOP + taskId,
  deleteTask: taskId =>  PATH_TASK_REMOVE + taskId,
}

