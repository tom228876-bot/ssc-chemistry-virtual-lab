# 3D asset sources and licenses

The apparatus loader uses optional GLB models and keeps procedural fallbacks if a remote asset cannot be fetched.

| Asset | GLB source | License / notes |
|---|---|---|
| Beaker | https://grab3d.com/models/props/beaker/ | CC0 1.0; 2K PBR textures; 5,668 triangles |
| Erlenmeyer flask | https://grab3d.com/models/props/erlenmeyer-flask/ | CC0 1.0; 2K PBR textures; 6,060 triangles |
| Burette assembly | https://grab3d.com/models/props/burette/ | CC0 1.0; includes stopcock key as a separate named part |
| Retort stand | https://grab3d.com/models/props/retort-stand/ | CC0 1.0; includes clamp and flask |

The GLB files are loaded from their source URLs at runtime. The app does not yet vendor these binary assets into this repository. Remote loading depends on the source host allowing cross-origin GLB requests; if unavailable, the procedural fallback remains visible.

## Runtime

- Three.js GLTFLoader loads GLB meshes and PBR materials.
- Rapier 3D provides rigid-body collision and gravity for spawned apparatus.
- The liquid stream is a lightweight visual/volume model, not a full CFD or SPH fluid solver.
