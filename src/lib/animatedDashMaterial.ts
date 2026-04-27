import { Color, Event, JulianDate, Material } from 'cesium'

const MATERIAL_TYPE = 'AnimatedDash'

function ensureRegistered() {
  const cache = (Material as any)._materialCache
  try {
    cache.addMaterial(MATERIAL_TYPE, {
      fabric: {
        type: MATERIAL_TYPE,
        uniforms: {
          color: Color.WHITE.clone(),
          speed: 0.002,
          dashLength: 0.08,
        },
        source: `
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  float offset = mod(czm_frameNumber * speed, 1.0);
  float phase = fract((materialInput.s - offset) / dashLength);
  if (phase > 0.5) discard;
  material.diffuse = color.rgb;
  material.alpha = color.a;
  return material;
}`,
      },
      translucent: true,
    })
  } catch {
    // Already registered (HMR reload or duplicate import)
  }
}

export class AnimatedDashMaterialProperty {
  readonly isConstant = false
  readonly definitionChanged = new Event()
  private _color: Color

  constructor(color: Color) {
    this._color = color
    ensureRegistered()
  }

  getType(_time: JulianDate): string {
    return MATERIAL_TYPE
  }

  getValue(_time: JulianDate, result: Record<string, unknown> = {}): Record<string, unknown> {
    result.color = this._color
    result.speed = 0.002
    result.dashLength = 0.08
    return result
  }

  equals(other: unknown): boolean {
    return (
      other instanceof AnimatedDashMaterialProperty &&
      Color.equals(this._color, (other as AnimatedDashMaterialProperty)._color)
    )
  }
}
