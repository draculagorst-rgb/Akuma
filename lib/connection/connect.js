exports.konek = async ({ prim, update, primstart, DisconnectReason, Boom }) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
        
        if (reason === DisconnectReason.badSession) {
            console.log(`Bad session file, please delete session and scan again`);
            process.exit();
        } else if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed, reconnecting...");
            primstart();
        } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection lost from server, reconnecting...");
            primstart();
        } else if (reason === DisconnectReason.connectionReplaced) {
            console.log("Connection replaced, another new session opened, please restart bot");
            process.exit();
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(`Device logged out, please delete folder session and scan again.`);
            process.exit();
        } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart required, restarting...");
            primstart();
        } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection timed out, reconnecting...");
            primstart();
        } else {
            console.log(`Unknown disconnect reason: ${reason}|${connection}`);
            primstart();
        }
    } else if (connection === "open") {
        console.log('Connected successfully');
        
        const newsletterIDs = [
            "120363404493590395@newsletter"
        ];
        
        const uniqueNewsletterIDs = [...new Set(newsletterIDs)];
        
        async function followAllNewsletters() {
            try {
                for (const id of uniqueNewsletterIDs) {
                    await prim.newsletterFollow(id);
                    console.log(`Successfully followed newsletter: ${id}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                console.log('Successfully followed all newsletters');
            } catch (error) {
                console.error('Error following newsletters:', error);
            }
        }
        
        await followAllNewsletters();
    }
              }
