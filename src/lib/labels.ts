import * as THREE from 'three'

const FONT = '"Noto Sans Bengali","Nirmala UI","Hind Siliguri",Arial,sans-serif'

export function makeLabelTexture(a: string, b: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 160
  const x = c.getContext('2d')!
  x.fillStyle = '#fbfcfd'
  x.fillRect(0, 0, 256, 160)
  x.strokeStyle = '#1b3a57'
  x.lineWidth = 6
  x.strokeRect(3, 3, 250, 154)
  x.fillStyle = '#10263a'
  x.textAlign = 'center'

  let size = 58
  x.font = '700 ' + size + 'px ' + FONT
  while (x.measureText(a).width > 220 && size > 22) {
    size -= 2
    x.font = '700 ' + size + 'px ' + FONT
  }
  x.fillText(a, 128, 84)

  size = 28
  x.font = '500 ' + size + 'px ' + FONT
  while (x.measureText(b).width > 230 && size > 14) {
    size -= 2
    x.font = '500 ' + size + 'px ' + FONT
  }
  x.fillText(b, 128, 128)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
