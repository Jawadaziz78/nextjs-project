pipeline {
    agent any
    
    stages {
        stage('Check Project Structure') {
            steps {
                script {
                    // 1. Clean workspace
                    cleanWs()
                    
                    // 2. Clone the repo freshly
                    checkout scm
                    
                    // 3. List files to see structure
                    sh '''
                        echo "------------------------------------------------"
                        echo "📂 LISTING REPOSITORY ROOT FILES:"
                        ls -la
                        echo "------------------------------------------------"
                        
                        if [ -d "web" ]; then
                            echo "✅ Found 'web' folder. Listing contents:"
                            ls -la web
                            
                            if [ -f "web/package.json" ]; then
                                echo "🎯 CONFIRMED: package.json is inside 'web' folder."
                                echo "👉 You MUST keep 'cd web' in your script."
                            else
                                echo "⚠️ 'web' folder exists, but NO package.json found inside it."
                            fi
                        else
                            echo "❌ NO 'web' folder found."
                            
                            if [ -f "package.json" ]; then
                                echo "🎯 CONFIRMED: package.json is in the ROOT."
                                echo "👉 You should REMOVE 'cd web' from your script."
                            else
                                echo "❌ CRITICAL: No package.json found in root OR web folder."
                            fi
                        fi
                        echo "------------------------------------------------"
                    '''
                }
            }
        }
    }
}
