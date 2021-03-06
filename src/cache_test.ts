/*!
   Copyright 2018 Propel http://propel.site/.  All rights reserved.
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

// Node-only test. Browsers have caching built-in.

import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import {
  localServer,
  test,
} from "../tools/tester";
import * as cache from "./cache";
import {
  assert,
  assertEqual,
  IS_NODE,
  nodeRequire,
  process,
  tmpdir
} from "./util";

// Some large datasets are external to the repository, and we would like
// to cache the downloads during CI. Only in these tests do we use
// an alternative cache dir, in the tmp dir.
function setup() {
  if (IS_NODE) {
    const d = path.join(tmpdir(), "propel_cache_test");
    process.env.PROPEL_ROOT = d;
    rimraf.sync(d);
    fs.mkdirSync(d);
  }
}

function teardown() {
  if (IS_NODE) {
    delete process.env["PROPEL_ROOT"];
  }
}

if (IS_NODE) {
  function assertPathEndsWith(actual: string, expected: string): void {
    // Split and join done for windows compat.
    const { join } = nodeRequire("path");
    const expected2 = join(...expected.split("/"));
    assert(actual.endsWith(expected2));
  }

  test(async function cache_url2Filename() {
    const actual = cache.url2Filename(
      "http://propelml.org/data/mnist/train-images-idx3-ubyte.bin");
    const expected =
      ".propel/cache/propelml.org/data/mnist/train-images-idx3-ubyte.bin";
    assertPathEndsWith(actual, expected);
  });

  test(async function cache_url2FilenameQueryString() {
    const actual = cache.url2Filename(
      "https://unpkg.com/sha256@0.2.0/?meta");
    const expected =
      ".propel/cache/unpkg.com/sha256%400.2.0/%3Fmeta";
    assertPathEndsWith(actual, expected);
  });
}

test(async function cache_fetchWithCache() {
  setup();
  cache.clearAll();
  await localServer(async function(url: string) {
    url += "/data/mnist/train-images-idx3-ubyte.bin";
    const ab = await cache.fetchWithCache(url);
    assertEqual(ab.byteLength, 47040016);
    if (IS_NODE) {
      assert(fs.existsSync(cache.url2Filename(url)));
    }
  });
  teardown();
});
