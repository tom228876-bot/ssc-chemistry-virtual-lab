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
  x.font = '700 58px ' + FONT
  x.fillText(a, 128, 84)
  x.font = '500 28px ' + FONT
  x.fillText(b, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
