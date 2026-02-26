@echo off
echo 🚀 리액트 빌드 시작...
call npm run build

echo 📦 빌드 파일 압축 중...
tar -cvf dist.tar ./dist

echo 🌐 EC2 서버로 전송 중...
scp -i "new-key.pem" dist.tar ec2-user@3.36.24.242:/home/ec2-user/

echo 🛠️ EC2 서버에서 기존 파일 삭제 및 교체 중...
ssh -i "new-key.pem" ec2-user@3.36.24.242 "tar -xvf dist.tar && sudo rm -rf /usr/share/nginx/html/* && sudo cp -rv dist/* /usr/share/nginx/html/ && sudo chmod -R 755 /usr/share/nginx/html && rm -rf dist.tar dist"

echo ✅ 배포 완료!