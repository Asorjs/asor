import Asor from '../index.js'

window.Asor = Asor

queueMicrotask(() => Asor.start())