with open("frontend/src/app/globals.css", "a") as f:
    f.write("\n@keyframes pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.5; }\n}\n")
print("Appended pulse to globals.css")
