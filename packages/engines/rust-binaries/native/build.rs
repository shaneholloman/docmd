// build.rs — required by napi-build to set up the correct linker flags
// for building a .node (cdylib) that Node.js can load.
fn main() {
    napi_build::setup();
}