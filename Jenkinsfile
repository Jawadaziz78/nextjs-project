pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DEPLOY_HOST     = '172.31.77.148'
        DEPLOY_USER     = 'ubuntu'
        // FIX: Renamed to BASE dir. We will create specific subfolders for each project automatically.
        BUILD_BASE_DIR  = '/home/ubuntu/build-staging'
        
        // CHANGE THIS variable for each project (laravel, vue, or nextjs)
        PROJECT_TYPE    = 'nextjs' 
        
        // SLACK CONFIGURATION (Commented Out)
        // SLACK_PART_A  = 'https://hooks.slack.com/services/'
        // SLACK_PART_B  = 'T01KC5SLA49/B0A284K2S6T/'
        // SLACK_PART_C  = 'JRJsWNSYnh2tujdMo4ph0Tgp'
    }

    stages {
        
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                        set -e
                        
                        # FIX: Create a unique directory for this project type
                        # This prevents Next.js trying to build Laravel files (and vice versa)
                        PROJECT_BUILD_DIR=\\"${BUILD_BASE_DIR}/${PROJECT_TYPE}\\"
                        mkdir -p \\$PROJECT_BUILD_DIR
                        cd \\$PROJECT_BUILD_DIR
                        
                        # FIX: Initialize Repo if it doesn't exist or if URL is wrong
                        if [ ! -d .git ]; then
                            echo 'First time run: Cloning repository...'
                            # Jenkins automatically provides the GIT_URL variable
                            git clone ${GIT_URL} .
                        else
                             # Safety Check: If the folder has the wrong repo, wipe it and re-clone
                             # This fixes the 'divergent branches' and 'wrong project files' errors
                             CURRENT_REMOTE=\\$(git config --get remote.origin.url)
                             if [ \\"\\$CURRENT_REMOTE\\" != \\"${GIT_URL}\\" ]; then
                                 echo '⚠️ Remote mismatch detected! Cleaning and re-cloning...'
                                 cd ..
                                 rm -rf \\$PROJECT_BUILD_DIR
                                 mkdir -p \\$PROJECT_BUILD_DIR
                                 cd \\$PROJECT_BUILD_DIR
                                 git clone ${GIT_URL} .
                             fi
                        fi
                        
                        # Normal Git Operations
                        git fetch origin ${BRANCH_NAME:-main}
                        git reset --hard origin/${BRANCH_NAME:-main}
                        git checkout ${BRANCH_NAME:-main} 

                        case \\"${PROJECT_TYPE}\\" in
                            laravel)
                                # FIX: Copy .env if missing so artisan commands don't fail
                                if [ ! -f .env ]; then cp .env.example .env; fi
                                
                                echo 'Running Laravel Optimization Tasks...'
                                php artisan key:generate --force
                                php artisan config:cache
                                php artisan route:cache
                                php artisan view:cache
                                ;;
                            
                            vue)
                                echo '⚙️ Vue code updated. Skipping build/install.'
                                ;;
                            
                            nextjs)
                                echo '⚙️ Next.js code updated. Skipping build/install.'
                                ;;
                        esac
                        
                        echo '✅ Build/Update Successful'
                    "
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                // FIX: Define LIVE_DIR in Groovy to prevent 'mkdir missing operand' error
                script {
                    def projectDirs = [
                        'laravel': '/home/ubuntu/projects/laravel/BookStack',
                        'vue':     '/home/ubuntu/projects/vue/app',
                        'nextjs':  '/home/ubuntu/projects/nextjs/blog'
                    ]
                    env.LIVE_DIR = projectDirs[env.PROJECT_TYPE]
                }

                sshagent(['deploy-server-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                        set -e
                        
                        # FIX: Use the specific build folder for this project
                        PROJECT_BUILD_DIR=\\"${BUILD_BASE_DIR}/${PROJECT_TYPE}\\"

                        # RSYNC TO LIVE 
                        mkdir -p ${LIVE_DIR}
                        # Sync from the project-specific folder
                        rsync -av --delete --exclude='.env' --exclude='.git' --exclude='bootstrap/cache/*.php' --exclude='storage' --exclude='public/storage' --exclude='node_modules' --exclude='vendor' --exclude='public/dist' \\${PROJECT_BUILD_DIR}/ ${LIVE_DIR}/

                        # RUN POST-DEPLOY COMMANDS
                        cd ${LIVE_DIR}

                        # Load Node 20
                        # FIX: Hardcoded path based on your diagnostic result
                        export NVM_DIR='/home/ubuntu/.nvm'
                        [ -s \\"/home/ubuntu/.nvm/nvm.sh\\" ] && . \\"/home/ubuntu/.nvm/nvm.sh\\"
                        nvm use 20

                        # Run project-specific post-deploy tasks
                        case \\"${PROJECT_TYPE}\\" in
                            laravel)
                                echo '⚙️ Running Compulsory Laravel Tasks...'
                                
                                # 1. Force delete poisoned config cache (Critical Fix)
                                rm -f bootstrap/cache/*.php
                                
                                # 2. Update Database 
                                php artisan migrate --force
                                
                                # 3. Refresh Config Cache
                                php artisan config:cache
                                
                                # 4. Reload Server 
                                sudo systemctl reload nginx
                                ;;
                            
                            vue)
                                echo 'Reloading Vue...'
                                sudo systemctl reload nginx
                                ;;
                            
                            nextjs)
                                echo 'Rebuilding Next.js...'
                                
                                # !!! IMPORTANT: If your package.json is in the root, REMOVE 'cd web' below !!!
                                cd web
                                
                                npm run build
                                pm2 restart all
                                sudo systemctl reload nginx
                                ;;
                        esac
                        
                        echo '✅ DEPLOYMENT SUCCESSFUL'
                    "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded. (Slack notification is commented out)"
            // sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"Jawad Deployment SUCCESS: ${env.JOB_NAME} (Build #${env.BUILD_NUMBER})\"}' ${SLACK_PART_A}${SLACK_PART_B}${SLACK_PART_C}"
        }
        failure {
            echo "Pipeline failed. (Slack notification is commented out)"
            // sh "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"Jawad Deployment FAILED: ${env.JOB_NAME} (Build #${env.BUILD_NUMBER})\"}' ${SLACK_PART_A}${SLACK_PART_B}${SLACK_PART_C}"
        }
    }
}
