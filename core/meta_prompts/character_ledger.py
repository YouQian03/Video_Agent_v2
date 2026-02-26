# core/meta_prompts/character_ledger.py
"""
Meta Prompt: 角色清单生成 (Character Ledger Generation)
三阶段架构：Discovery → Presence Audit → Continuity Check
用于 Pillar II: Narrative Template 的 characterLedger 数据

Architecture:
  Pass 1 (Discovery): 2-3 key frames → identify cast list (who exists)
  Pass 2 (Presence Audit): per-character batched frame audit (where they appear)
  Pass 3 (Continuity Check): deterministic gap-filling + surgical re-check
"""

from typing import Dict, Any, List, Tuple

# ============================================================
# Pass 1: Character Discovery Prompt
# Uses 2-3 wide-angle key frames to establish the cast list
# ============================================================
CHARACTER_DISCOVERY_PROMPT = """
# Role: Casting Director
# Task: Identify ALL distinct characters/entities in this video.

# You are provided with:
# 1. Text descriptions (Subject, Scene) for ALL shots in the video
# 2. 2-3 representative KEY FRAMES selected from the widest camera angles

# Instructions:
1. Examine the key frames carefully — they show the most complete view of the scene.
2. Identify every distinct individual or defined group (e.g., "crowd", "family of four").
3. For each character, provide a detailed visual description based on what you see in the images.
4. Assign importance: PRIMARY for main characters (appear frequently, drive the narrative), SECONDARY for minor/background characters.
5. WATERMARK AWARENESS: Ignore watermarks, logos, or social media UI overlays. Never describe them as character features.
6. Do NOT determine appearsInShots here — that will be handled in a separate audit step.

# Constraints:
- Output ONLY valid JSON.
- No markdown formatting, no conversational filler.

# Schema:
{
  "characters": [
    {
      "entityId": "orig_char_01",
      "displayName": "Short descriptive name",
      "visualDescription": "Detailed physical appearance: species/body type, coloring, clothing, accessories, distinguishing features.",
      "importance": "PRIMARY or SECONDARY"
    }
  ]
}

# Shot Descriptions (for context):
{shot_subjects}
"""

# ============================================================
# Pass 2: Character Presence Audit Prompt
# Per-character, batched frame verification
# ============================================================
CHARACTER_PRESENCE_AUDIT_PROMPT = """
# Role: Eagle-Eyed Visibility Auditor
# Task: For the target character described below, examine EVERY frame image independently and determine if this character is physically visible.

# Target Character:
- Name: {char_name}
- Visual Description: {char_description}

# CRITICAL RULES:
1. Check EVERY frame INDEPENDENTLY. Do NOT assume content is the same as previous frames.
2. A character counts as "visible" even if partially shown (edge of frame, blurred, behind another subject, partially occluded).
3. Look at the ACTUAL IMAGE content, not just the shot label or description text.
4. When in doubt, mark as VISIBLE. False positives are far less harmful than false negatives.
5. WATERMARK/LOGO FILTER: Ignore any watermarks, logos, social media UI, channel icons, or brand graphics. These are NOT characters. Only mark HUMAN or ANIMAL subjects as visible.

# Output format — a JSON array with one entry per frame:
{
  "audit": [
    {"shotId": "shot_01", "visible": true},
    {"shotId": "shot_02", "visible": false}
  ]
}

# Frames to audit:
"""

# ============================================================
# Pass 2 (Batch): All-Character Presence Matrix — single API call
# Replaces per-character sequential audit with O(1) API call
# ============================================================
CHARACTER_BATCH_AUDIT_PROMPT = """
# Role: Eagle-Eyed Casting Auditor
# Task: You are given a list of characters and a set of frame images from a video.
# For EACH frame, determine which of the listed characters are PHYSICALLY VISIBLE.

# Characters to track:
{characters_list}

# CRITICAL RULES:
1. Check EVERY frame INDEPENDENTLY. Do NOT assume content is the same as previous frames.
2. A character counts as "visible" even if partially shown (edge of frame, blurred, behind another subject, partially occluded).
3. Look at the ACTUAL IMAGE content, not just the shot label or description text.
4. When in doubt, mark as VISIBLE. False positives are far less harmful than false negatives.
5. WATERMARK/LOGO FILTER: Ignore any watermarks, logos, social media UI, channel icons, or brand graphics. These are NOT characters. Only mark HUMAN or ANIMAL subjects as visible.
6. You MUST output an entry for EVERY shot ID listed below, even if no characters are present (use empty array).

# Output format (strict JSON):
{{
  "auditMatrix": [
    {{
      "shotId": "shot_01",
      "presentCharacterIds": ["orig_char_01", "orig_char_02"]
    }},
    {{
      "shotId": "shot_02",
      "presentCharacterIds": []
    }}
  ]
}}

# Frames to audit:
"""

# ============================================================
# 场景/环境提取提示词 (Environment Extraction Prompt)
# 确保 100% 镜头覆盖率
# ============================================================
ENVIRONMENT_EXTRACTION_PROMPT = """
# Role: Architectural Location Scout and Scene Auditor
# Task: Extract every unique physical location and ensure 100% shot-to-environment mapping.

# Instructions:
1. Perform a "Location Audit": Every single shot ID provided MUST be assigned to an environment entity.
2. CLUSTER LOCATIONS: Group shots that take place in the same physical space (e.g., "Inside McDonald's at a table" and "Inside McDonald's by the counter" = "McDonald's Interior").
3. DIFFERENTIATE: If a location is distinct (e.g., "Car Interior" vs "Street Outside"), they must be separate entities.
4. Visual Description: Synthesize the atmospheric details (lighting, weather, specific props/landmarks) from the combined shots.

# Constraints:
- Output ONLY valid JSON.
- No markdown, no filler.
- TOTAL COVERAGE: Every shot ID in the input must appear in exactly one 'appearsInShots' array.

# Schema:
{
  "environments": [
    {
      "entityId": "orig_env_01",
      "displayName": "Specific location name",
      "appearsInShots": ["shot_01"],
      "visualDescription": "Atmospheric and architectural details: lighting, time of day, weather, key background elements.",
      "importance": "PRIMARY or SECONDARY"
    }
  ]
}

# Input Data:
{shot_subjects}
"""

# ============================================================
# Legacy prompt (kept for backward compatibility)
# ============================================================
CHARACTER_EXTRACTION_PROMPT = CHARACTER_DISCOVERY_PROMPT  # Legacy alias
CHARACTER_CLUSTERING_PROMPT = CHARACTER_DISCOVERY_PROMPT  # Legacy alias


# ============================================================
# Helper Functions
# ============================================================

def build_shot_subjects_input(shots: List[Dict]) -> str:
    """
    构建 shot subjects 输入文本供 AI 聚类

    Args:
        shots: Pillar III 的 concrete shots 列表

    Returns:
        格式化的 shot subjects 文本
    """
    lines = []
    for shot in shots:
        shot_id = shot.get("shotId", "unknown")
        subject = shot.get("subject", "No subject")
        scene = shot.get("scene", "No scene")
        first_frame = shot.get("firstFrameDescription", "")

        lines.append(f"- {shot_id}:")
        lines.append(f"    Subject: {subject}")
        lines.append(f"    Scene: {scene}")
        if first_frame:
            lines.append(f"    FirstFrame: {first_frame}")
        lines.append("")

    return "\n".join(lines)


def select_key_frames(shots: List[Dict]) -> List[Dict]:
    """
    选取 2-3 张最具代表性的宽景帧用于 Discovery Pass

    策略: WS > MS > CU 优先级，从前、中、后三个区间各选一张

    Args:
        shots: Pillar III 的 concrete shots 列表

    Returns:
        选中的 2-3 个 shot 字典列表
    """
    if len(shots) <= 3:
        return list(shots)

    # Shot size priority: wider = better for discovering characters
    size_priority = {
        "EWS": 0, "VWS": 0, "WS": 1, "MWS": 2, "MS": 3,
        "MCU": 4, "CU": 5, "BCU": 6, "ECU": 6,
    }

    def shot_score(shot: Dict) -> int:
        """Lower score = wider shot = better for discovery"""
        camera = shot.get("camera", {})
        shot_size = camera.get("shotSize", shot.get("shotSize", shot.get("shotType", "MS")))
        return size_priority.get(shot_size, 3)  # Default to MS priority

    # Divide shots into 3 segments: front, middle, back
    n = len(shots)
    segments = [
        shots[:n // 3],               # front
        shots[n // 3: 2 * n // 3],    # middle
        shots[2 * n // 3:],           # back
    ]

    key_frames = []
    for segment in segments:
        if segment:
            # Pick the widest shot in this segment
            best = min(segment, key=shot_score)
            key_frames.append(best)

    # Deduplicate (if same shot selected twice)
    seen_ids = set()
    unique_frames = []
    for shot in key_frames:
        sid = shot.get("shotId", "")
        if sid not in seen_ids:
            seen_ids.add(sid)
            unique_frames.append(shot)

    return unique_frames


def check_character_continuity(
    characters: List[Dict],
    environments: List[Dict],
    all_shot_ids: List[str]
) -> Tuple[List[Dict], List[Dict]]:
    """
    Pass 3: 角色连续性检查 — 夹心缺失 + 环境锁定

    规则:
    - 仅处理 PRIMARY 角色
    - 角色在同一环境中覆盖率 > 50%
    - 单镜头空隙: 直接 deterministic gap-fill
    - 2-3 镜头空隙: 标记为 needs_recheck（由调用方发送单图审计）

    Args:
        characters: character ledger 列表
        environments: environment ledger 列表
        all_shot_ids: 所有 shot ID 有序列表

    Returns:
        (updated_characters, recheck_requests)
        recheck_requests: [{"entityId": "...", "shotId": "...", "char_name": "...", "char_desc": "..."}]
    """
    # Build environment map: shot_id -> env_id
    shot_to_env = {}
    for env in environments:
        for sid in env.get("appearsInShots", []):
            shot_to_env[sid] = env.get("entityId", "")

    recheck_requests = []

    for char in characters:
        if char.get("importance") != "PRIMARY":
            continue

        appears_set = set(char.get("appearsInShots", []))
        entity_id = char.get("entityId", "")
        char_name = char.get("displayName", "")
        char_desc = char.get("detailedDescription", "") or char.get("visualSignature", "")

        # Group shots by environment
        env_groups = {}  # env_id -> [shot_ids in order]
        for sid in all_shot_ids:
            env_id = shot_to_env.get(sid, "unknown")
            if env_id not in env_groups:
                env_groups[env_id] = []
            env_groups[env_id].append(sid)

        for env_id, env_shots in env_groups.items():
            if len(env_shots) < 2:
                continue

            # Coverage in this environment
            present_in_env = [s for s in env_shots if s in appears_set]
            coverage = len(present_in_env) / len(env_shots)

            if coverage < 0.5:
                # Character appears in less than half of this environment's shots
                # Not a candidate for gap-filling
                continue

            # Find gaps (consecutive missing shots flanked by present shots)
            missing_in_env = [s for s in env_shots if s not in appears_set]
            if not missing_in_env:
                continue

            # For each missing shot, check if it's a "sandwich gap"
            for missing_sid in missing_in_env:
                idx = env_shots.index(missing_sid)

                # Find nearest present shot before and after
                has_before = any(s in appears_set for s in env_shots[:idx])
                has_after = any(s in appears_set for s in env_shots[idx + 1:])

                if not (has_before and has_after):
                    # Not a sandwich — character might have entered/exited
                    continue

                # Calculate gap size: consecutive missing shots around this one
                gap_start = idx
                while gap_start > 0 and env_shots[gap_start - 1] not in appears_set:
                    gap_start -= 1
                gap_end = idx
                while gap_end < len(env_shots) - 1 and env_shots[gap_end + 1] not in appears_set:
                    gap_end += 1
                gap_size = gap_end - gap_start + 1

                if gap_size == 1:
                    # Single-shot gap: deterministic fill
                    appears_set.add(missing_sid)
                    print(f"   ✅ [Continuity] Auto-filled {entity_id} into {missing_sid} (1-shot gap in {env_id})")
                elif gap_size <= 3:
                    # 2-3 shot gap: request surgical re-check
                    recheck_requests.append({
                        "entityId": entity_id,
                        "shotId": missing_sid,
                        "char_name": char_name,
                        "char_desc": char_desc,
                    })
                    print(f"   🔍 [Continuity] Requesting re-check for {entity_id} in {missing_sid} ({gap_size}-shot gap in {env_id})")
                # gap_size > 3: do not fill — character likely genuinely absent

        # Update the character's appearsInShots
        char["appearsInShots"] = sorted(list(appears_set), key=lambda s: all_shot_ids.index(s) if s in all_shot_ids else 999)
        char["shotCount"] = len(char["appearsInShots"])

    return characters, recheck_requests


# ============================================================
# Surgical Re-check Prompt (Pass 3 follow-up)
# Single-image YES/NO verification
# ============================================================
SURGICAL_RECHECK_PROMPT = """
# Task: Is the following character PHYSICALLY VISIBLE in this image?

# Character:
- Name: {char_name}
- Appearance: {char_description}

# Rules:
- Look ONLY at the image. Ignore any text overlays or watermarks.
- WATERMARK/LOGO FILTER: Watermarks, logos, channel icons, and brand graphics are NOT characters. Only look for HUMAN or ANIMAL subjects.
- "Visible" includes: partially shown, edge of frame, blurred, behind objects.
- Answer with ONLY a JSON object: {{"visible": true}} or {{"visible": false}}
"""


def process_ledger_result(ai_output: Dict[str, Any], all_shot_ids: List[str] = None) -> Dict[str, Any]:
    """
    处理 AI 输出，验证和规范化 character ledger 数据

    Args:
        ai_output: Gemini 返回的原始 JSON
        all_shot_ids: 所有 shot ID 列表，用于验证覆盖率

    Returns:
        规范化的 ledger 数据
    """
    if not ai_output.get("clusteringSuccess"):
        return {
            "characterLedger": [],
            "environmentLedger": [],
            "clusteringSummary": {"error": "Clustering failed"}
        }

    # 验证并规范化 character ledger
    character_ledger = []
    for char in ai_output.get("characterLedger", []):
        normalized = {
            "entityId": char.get("entityId", ""),
            "entityType": char.get("entityType", "CHARACTER"),
            "importance": char.get("importance", "SECONDARY"),
            "displayName": char.get("displayName", "Unknown"),
            "visualSignature": char.get("visualSignature", ""),
            "detailedDescription": char.get("detailedDescription", ""),
            "appearsInShots": char.get("appearsInShots", []),
            "shotCount": len(char.get("appearsInShots", [])),
            "trackingConfidence": char.get("trackingConfidence", "MEDIUM"),
            "visualCues": char.get("visualCues", [])
        }

        # 确保 entityId 格式正确
        if not normalized["entityId"].startswith("orig_char_"):
            normalized["entityId"] = f"orig_char_{len(character_ledger) + 1:02d}"

        character_ledger.append(normalized)

    # 验证并规范化 environment ledger
    environment_ledger = []
    for env in ai_output.get("environmentLedger", []):
        normalized = {
            "entityId": env.get("entityId", ""),
            "entityType": "ENVIRONMENT",
            "importance": env.get("importance", "SECONDARY"),
            "displayName": env.get("displayName", "Unknown"),
            "visualSignature": env.get("visualSignature", ""),
            "detailedDescription": env.get("detailedDescription", ""),
            "appearsInShots": env.get("appearsInShots", []),
            "shotCount": len(env.get("appearsInShots", []))
        }

        # 确保 entityId 格式正确（保留 env_graphic_ 前缀用于图形场景）
        if not normalized["entityId"].startswith("orig_env_") and not normalized["entityId"].startswith("env_graphic_"):
            normalized["entityId"] = f"orig_env_{len(environment_ledger) + 1:02d}"

        environment_ledger.append(normalized)

    # 🎯 Post-processing: Ensure 100% environment shot coverage
    if all_shot_ids:
        # Collect all shots covered by environments
        env_covered = set()
        for env in environment_ledger:
            env_covered.update(env.get("appearsInShots", []))

        missing_shots = [sid for sid in all_shot_ids if sid not in env_covered]

        if missing_shots:
            print(f"   ⚠️ [Post-processing] {len(missing_shots)} shots not covered by environments: {missing_shots[:5]}{'...' if len(missing_shots) > 5 else ''}")

            if environment_ledger:
                main_env = max(environment_ledger, key=lambda e: len(e.get("appearsInShots", [])))
                main_env["appearsInShots"].extend(missing_shots)
                main_env["shotCount"] = len(main_env["appearsInShots"])
                print(f"   ✅ [Post-processing] Added {len(missing_shots)} missing shots to '{main_env['displayName']}'")
            else:
                generic_env = {
                    "entityId": "orig_env_01",
                    "entityType": "ENVIRONMENT",
                    "importance": "PRIMARY",
                    "displayName": "Video Setting",
                    "visualSignature": "General video environment",
                    "detailedDescription": "The main setting of the video",
                    "appearsInShots": missing_shots,
                    "shotCount": len(missing_shots)
                }
                environment_ledger.append(generic_env)
                print(f"   ✅ [Post-processing] Created generic environment for {len(missing_shots)} missing shots")

    # 计算汇总信息
    primary_chars = [c for c in character_ledger if c["importance"] == "PRIMARY"]
    secondary_chars = [c for c in character_ledger if c["importance"] == "SECONDARY"]

    summary = {
        "totalCharacters": len(character_ledger),
        "primaryCharacters": len(primary_chars),
        "secondaryCharacters": len(secondary_chars),
        "totalEnvironments": len(environment_ledger),
        "totalShots": ai_output.get("clusteringSummary", {}).get("totalShots", 0),
        "unclusteredShots": ai_output.get("clusteringSummary", {}).get("unclusteredShots", [])
    }

    return {
        "characterLedger": character_ledger,
        "environmentLedger": environment_ledger,
        "clusteringSummary": summary
    }


def get_ledger_display_summary(ledger_data: Dict[str, Any]) -> str:
    """
    生成人类可读的 ledger 摘要
    """
    summary = ledger_data.get("clusteringSummary", {})
    chars = ledger_data.get("characterLedger", [])
    envs = ledger_data.get("environmentLedger", [])

    lines = [
        "=== Character Ledger Summary ===",
        f"Characters: {summary.get('totalCharacters', 0)} ({summary.get('primaryCharacters', 0)} primary, {summary.get('secondaryCharacters', 0)} secondary)",
        f"Environments: {summary.get('totalEnvironments', 0)}",
        "",
        "PRIMARY Characters:"
    ]

    for char in chars:
        if char.get("importance") == "PRIMARY":
            lines.append(f"  - {char['entityId']}: {char['displayName']} (appears in {char['shotCount']} shots)")

    lines.append("")
    lines.append("Environments:")
    for env in envs:
        lines.append(f"  - {env['entityId']}: {env['displayName']} ({env['shotCount']} shots)")

    return "\n".join(lines)


def update_shots_with_entity_refs(shots: List[Dict], ledger_data: Dict[str, Any]) -> List[Dict]:
    """
    更新 shots 数据，添加 entityRefs 字段

    Args:
        shots: 原始 shots 列表
        ledger_data: character ledger 数据

    Returns:
        更新后的 shots 列表，每个 shot 包含 entityRefs
    """
    # 建立 shot -> entities 的反向映射
    shot_to_chars = {}
    shot_to_envs = {}

    for char in ledger_data.get("characterLedger", []):
        for shot_id in char.get("appearsInShots", []):
            if shot_id not in shot_to_chars:
                shot_to_chars[shot_id] = []
            shot_to_chars[shot_id].append(char["entityId"])

    for env in ledger_data.get("environmentLedger", []):
        for shot_id in env.get("appearsInShots", []):
            if shot_id not in shot_to_envs:
                shot_to_envs[shot_id] = []
            shot_to_envs[shot_id].append(env["entityId"])

    # 更新每个 shot
    updated_shots = []
    for shot in shots:
        shot_id = shot.get("shotId", "")
        updated_shot = shot.copy()
        updated_shot["entityRefs"] = {
            "characters": shot_to_chars.get(shot_id, []),
            "environments": shot_to_envs.get(shot_id, [])
        }
        updated_shots.append(updated_shot)

    return updated_shots
