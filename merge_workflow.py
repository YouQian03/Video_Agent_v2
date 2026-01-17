# merge_workflow.py
import argparse
import sys
from pathlib import Path
from core.workflow_manager import WorkflowManager

def main():
    # 1. 设置命令行参数，方便你指定要合并哪个 Job
    parser = argparse.ArgumentParser(description="一键合并分镜视频为最终成片")
    parser.add_argument("--job_id", required=True, help="请输入 Job ID (例如: job_6db68d0c)")
    args = parser.parse_args()

    print(f"🚀 正在启动合并程序，目标 Job: {args.job_id}")

    try:
        # 2. 初始化管理器并定位到该 Job
        # 注意：这里我们传入了 project_root，确保路径绝对正确
        project_root = Path(__file__).parent
        manager = WorkflowManager(args.job_id, project_root=project_root)
        
        if not manager.workflow:
            print(f"❌ 找不到该 Job 的数据，请检查 jobs/{args.job_id} 文件夹是否存在。")
            return

        # 3. 调用刚才在 core 里写好的合并逻辑
        result_file = manager.merge_videos()
        
        print("\n" + "="*30)
        print(f"✅ 合并成功！")
        print(f"📁 成片路径: jobs/{args.job_id}/{result_file}")
        print("="*30)

    except Exception as e:
        print(f"\n❌ 合并过程中发生错误: {str(e)}")
        # 打印详细报错方便我们排雷
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()