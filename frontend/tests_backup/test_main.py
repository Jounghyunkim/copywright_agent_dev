import unittest
from src.main import main

class TestMain(unittest.TestCase):
    def test_startup(self):
        # 기본적인 실행 테스트 (현재는 단순 호출 확인)
        try:
            main()
            success = True
        except Exception:
            success = False
        self.assertTrue(success)

if __name__ == "__main__":
    unittest.main()
