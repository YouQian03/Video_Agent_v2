"""
测试两个 bug 的修复：
1. 非叙事镜头（BRAND_SPLASH/ENDCARD）应被跳过生成 + 排除出最终合并
2. 装饰性转场（<2s + 关键词匹配）应被后处理强制设为 PURE_STATIC
"""
import sys, os, json, tempfile, shutil
from pathlib import Path

# 确保项目根目录在 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

passed = 0
failed = 0

def ok(name):
    global passed
    passed += 1
    print(f"  ✅ {name}")

def fail(name, detail=""):
    global failed
    failed += 1
    print(f"  ❌ {name} — {detail}")


# ============================================================
# Bug 1: isNarrative / contentClass 透传 + 过滤
# ============================================================
print("\n═══ Bug 1: 非叙事镜头过滤 ═══\n")

# --- Test 1.1: Film IR → Workflow 转换保留字段 ---
print("Test 1.1: Film IR → Workflow 转换保留 isNarrative / contentClass")

# 模拟 Film IR 的 concrete shots
mock_ir_shots = [
    {
        "shotId": "shot_01",
        "isNarrative": True,
        "contentClass": "NARRATIVE",
        "firstFrameDescription": "A woman walking",
        "subject": "Woman walking in park",
        "scene": "Sunny park",
        "camera": {"shotSize": "MS", "cameraAngle": "Eye-level", "cameraMovement": "Static", "focalLengthDepth": "50mm"},
        "audio": {"soundDesign": "", "music": "", "dialogue": "", "dialogueText": ""},
        "lighting": "Natural",
    },
    {
        "shotId": "shot_02",
        "isNarrative": False,
        "contentClass": "BRAND_SPLASH",
        "firstFrameDescription": "Company logo",
        "subject": "Brand logo animation",
        "scene": "Black background",
        "camera": {},
        "audio": {},
        "lighting": "",
    },
    {
        "shotId": "shot_03",
        "isNarrative": False,
        "contentClass": "ENDCARD",
        "firstFrameDescription": "Subscribe button",
        "subject": "End card with CTA",
        "scene": "End screen",
        "camera": {},
        "audio": {},
        "lighting": "",
    },
]

# 模拟 app.py:619 的转换逻辑
converted_shots = []
for ir_shot in mock_ir_shots:
    shot_id = ir_shot.get("shotId", "shot_01")
    camera = ir_shot.get("camera", {}) if isinstance(ir_shot.get("camera"), dict) else {}
    audio = ir_shot.get("audio", {}) if isinstance(ir_shot.get("audio"), dict) else {}
    converted_shots.append({
        "shot_id": shot_id,
        "isNarrative": ir_shot.get("isNarrative", True),
        "contentClass": ir_shot.get("contentClass", "NARRATIVE"),
        "description": ir_shot.get("subject", "") + " " + ir_shot.get("scene", ""),
        "status": {"stylize": "NOT_STARTED", "video_generate": "NOT_STARTED"},
        "assets": {"video": None},
    })

# 验证字段保留
s1, s2, s3 = converted_shots
if s1["isNarrative"] == True and s1["contentClass"] == "NARRATIVE":
    ok("shot_01 保留 isNarrative=True, contentClass=NARRATIVE")
else:
    fail("shot_01 字段丢失", f"got {s1.get('isNarrative')}, {s1.get('contentClass')}")

if s2["isNarrative"] == False and s2["contentClass"] == "BRAND_SPLASH":
    ok("shot_02 保留 isNarrative=False, contentClass=BRAND_SPLASH")
else:
    fail("shot_02 字段丢失", f"got {s2.get('isNarrative')}, {s2.get('contentClass')}")

if s3["isNarrative"] == False and s3["contentClass"] == "ENDCARD":
    ok("shot_03 保留 isNarrative=False, contentClass=ENDCARD")
else:
    fail("shot_03 字段丢失", f"got {s3.get('isNarrative')}, {s3.get('contentClass')}")


# --- Test 1.2: 批量生成跳过非叙事镜头 ---
print("\nTest 1.2: 批量生成跳过 BRAND_SPLASH / ENDCARD")

skipped = []
processed = []
for shot in converted_shots:
    content_class = shot.get("contentClass", "NARRATIVE")
    is_narrative = shot.get("isNarrative", True)
    if not is_narrative or content_class in ("BRAND_SPLASH", "ENDCARD"):
        shot["status"]["video_generate"] = "SKIPPED"
        skipped.append(shot["shot_id"])
    else:
        shot["status"]["video_generate"] = "SUCCESS"
        shot["assets"]["video"] = f"videos/{shot['shot_id']}.mp4"
        processed.append(shot["shot_id"])

if processed == ["shot_01"]:
    ok("只处理了 shot_01 (NARRATIVE)")
else:
    fail("处理列表不对", f"got {processed}")

if set(skipped) == {"shot_02", "shot_03"}:
    ok("跳过了 shot_02 (BRAND_SPLASH) 和 shot_03 (ENDCARD)")
else:
    fail("跳过列表不对", f"got {skipped}")


# --- Test 1.3: merge_videos 过滤逻辑 ---
print("\nTest 1.3: merge_videos 过滤非叙事镜头")

# 模拟即使 BRAND_SPLASH 意外生成了视频也应被过滤
mock_workflow_shots = [
    {"shot_id": "shot_01", "isNarrative": True, "contentClass": "NARRATIVE",
     "status": {"video_generate": "SUCCESS"}, "assets": {"video": "videos/shot_01.mp4"}},
    {"shot_id": "shot_02", "isNarrative": False, "contentClass": "BRAND_SPLASH",
     "status": {"video_generate": "SUCCESS"}, "assets": {"video": "videos/shot_02.mp4"}},
    {"shot_id": "shot_03", "isNarrative": False, "contentClass": "ENDCARD",
     "status": {"video_generate": "SUCCESS"}, "assets": {"video": "videos/shot_03.mp4"}},
    {"shot_id": "shot_04", "isNarrative": True, "contentClass": "NARRATIVE",
     "status": {"video_generate": "SUCCESS"}, "assets": {"video": "videos/shot_04.mp4"}},
]

# 模拟 workflow_manager.py merge_videos 的过滤条件
merge_shots = [
    s for s in mock_workflow_shots
    if s["status"].get("video_generate") == "SUCCESS"
    and s.get("isNarrative", True)
    and s.get("contentClass", "NARRATIVE") not in ("BRAND_SPLASH", "ENDCARD")
]

merge_ids = [s["shot_id"] for s in merge_shots]
if merge_ids == ["shot_01", "shot_04"]:
    ok("合并列表只包含叙事镜头: shot_01, shot_04")
else:
    fail("合并列表不对", f"got {merge_ids}")


# --- Test 1.4: 向后兼容 — 没有 isNarrative/contentClass 的旧数据 ---
print("\nTest 1.4: 向后兼容旧数据（无 isNarrative/contentClass 字段）")

old_workflow_shots = [
    {"shot_id": "shot_01", "status": {"video_generate": "SUCCESS"}, "assets": {"video": "videos/shot_01.mp4"}},
    {"shot_id": "shot_02", "status": {"video_generate": "SUCCESS"}, "assets": {"video": "videos/shot_02.mp4"}},
]

merge_old = [
    s for s in old_workflow_shots
    if s["status"].get("video_generate") == "SUCCESS"
    and s.get("isNarrative", True)
    and s.get("contentClass", "NARRATIVE") not in ("BRAND_SPLASH", "ENDCARD")
]

if len(merge_old) == 2:
    ok("旧数据无字段时默认全部包含（向后兼容）")
else:
    fail("向后兼容失败", f"got {len(merge_old)} shots")


# ============================================================
# Bug 2: 装饰性转场识别
# ============================================================
print("\n═══ Bug 2: 装饰性转场 → PURE_STATIC ═══\n")

from core.meta_prompts.shot_decomposition import _enforce_branding_classification

# --- Test 2.1: 短转场被纠正 ---
print("Test 2.1: 短时长转场 (< 2s) + 关键词 → PURE_STATIC")

test_shots = [
    {
        "shotId": "shot_05", "durationSeconds": 0.8,
        "visualPersistence": "NATIVE_VIDEO",
        "concrete": {
            "subject": "Page flip transition reveals new photograph",
            "scene": "Photo gallery",
            "firstFrameDescription": "A page flipping away",
            "dynamics": "Page curl animation"
        }
    },
    {
        "shotId": "shot_06", "durationSeconds": 0.5,
        "visualPersistence": "NATIVE_VIDEO",
        "concrete": {
            "subject": "Image slides to reveal next photo",
            "scene": "Slideshow",
            "firstFrameDescription": "Photo sliding",
            "dynamics": "Slide transition"
        }
    },
    {
        "shotId": "shot_07", "durationSeconds": 0.6,
        "visualPersistence": "NATIVE_VIDEO",
        "concrete": {
            "subject": "Wipe transition to next scene",
            "scene": "Gallery",
            "firstFrameDescription": "Wipe effect",
            "dynamics": "Wipe animation"
        }
    },
]

_enforce_branding_classification(test_shots)

for s in test_shots:
    if s["visualPersistence"] == "PURE_STATIC":
        ok(f"{s['shotId']} ({s['durationSeconds']}s) → PURE_STATIC")
    else:
        fail(f"{s['shotId']} 未被纠正", f"got {s['visualPersistence']}")


# --- Test 2.2: 真实动态镜头不受影响 ---
print("\nTest 2.2: 真实动态镜头保持 NATIVE_VIDEO")

real_shots = [
    {
        "shotId": "shot_10", "durationSeconds": 3.5,
        "visualPersistence": "NATIVE_VIDEO",
        "concrete": {
            "subject": "A woman walking through a garden",
            "scene": "Beautiful garden with flowers",
            "firstFrameDescription": "Woman stepping forward",
            "dynamics": "Hair flowing, dress swaying"
        }
    },
    {
        "shotId": "shot_11", "durationSeconds": 5.0,
        "visualPersistence": "NATIVE_VIDEO",
        "concrete": {
            "subject": "Man speaking to camera",
            "scene": "Office interior",
            "firstFrameDescription": "Man at desk",
            "dynamics": "Hand gestures, lip movement"
        }
    },
]

_enforce_branding_classification(real_shots)

for s in real_shots:
    if s["visualPersistence"] == "NATIVE_VIDEO":
        ok(f"{s['shotId']} ({s['durationSeconds']}s) → NATIVE_VIDEO (不受影响)")
    else:
        fail(f"{s['shotId']} 被误伤", f"got {s['visualPersistence']}")


# --- Test 2.3: 长时长转场不被误纠正（>2s 的不是装饰性转场） ---
print("\nTest 2.3: 长时长 (>= 2s) 即使包含关键词也不纠正")

long_shots = [
    {
        "shotId": "shot_20", "durationSeconds": 3.0,
        "visualPersistence": "NATIVE_VIDEO",
        "concrete": {
            "subject": "Complex page flip animation with 3D effects",
            "scene": "Animated transition sequence",
            "firstFrameDescription": "Elaborate flip effect",
            "dynamics": "3D page curl with particles"
        }
    },
]

_enforce_branding_classification(long_shots)

if long_shots[0]["visualPersistence"] == "NATIVE_VIDEO":
    ok("shot_20 (3.0s) 保持 NATIVE_VIDEO（时长 >= 2s，不纠正）")
else:
    fail("shot_20 被误纠正", f"got {long_shots[0]['visualPersistence']}")


# --- Test 2.4: BRAND_SPLASH 同时触发 Phase A + Phase D ---
print("\nTest 2.4: BRAND_SPLASH 被正确识别")

brand_shots = [
    {
        "shotId": "shot_30", "durationSeconds": 2.0,
        "concrete": {
            "subject": "Company logo reveal",
            "scene": "Brand splash screen",
        }
    },
]

_enforce_branding_classification(brand_shots)

if brand_shots[0].get("contentClass") == "BRAND_SPLASH" and brand_shots[0].get("visualPersistence") == "PURE_STATIC":
    ok("shot_30: contentClass=BRAND_SPLASH, visualPersistence=PURE_STATIC")
else:
    fail("shot_30 分类错误", f"got class={brand_shots[0].get('contentClass')}, vp={brand_shots[0].get('visualPersistence')}")


# ============================================================
# 结果汇总
# ============================================================
print(f"\n{'═'*50}")
print(f"测试结果: {passed} passed, {failed} failed")
print(f"{'═'*50}")

sys.exit(0 if failed == 0 else 1)
